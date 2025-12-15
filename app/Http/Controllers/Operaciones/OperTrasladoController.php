<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OperTrasladoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    protected $kardexService;

    public function __construct(\App\Services\KardexService $kardexService)
    {
        $this->kardexService = $kardexService;
    }

    public function index()
    {
        // Mostrar traslados recientes
        $traslados = \App\Models\Operaciones\OperTraslado::with(['bodegaOrigen', 'bodegaDestino', 'usuarioSolicita'])
                        ->orderBy('id', 'desc')
                        ->paginate(20);
        return response()->json($traslados);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bodega_origen_id' => 'required|exists:log_bodegas,id',
            'bodega_destino_id' => 'required|exists:log_bodegas,id|different:bodega_origen_id',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:inv_productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'observaciones' => 'nullable|string'
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function() use ($validated, $request) {
            
            // Generar número correlativo
            $lastId = \App\Models\Operaciones\OperTraslado::max('id') ?? 0;
            $numero = 'TR-' . str_pad($lastId + 1, 6, '0', STR_PAD_LEFT);

            // 1. Crear Cabecera de Traslado
            $traslado = \App\Models\Operaciones\OperTraslado::create([
                'numero_traslado' => $numero,
                'bodega_origen_id' => $validated['bodega_origen_id'],
                'bodega_destino_id' => $validated['bodega_destino_id'],
                'usuario_solicita_id' => auth()->id(),
                'fecha_solicitud' => now(),
                'estado' => 'pendiente',
                'observaciones' => $request->observaciones
            ]);

            foreach ($validated['detalles'] as $detalle) {
                $traslado->detalles()->create([
                    'producto_id' => $detalle['producto_id'],
                    'cantidad_enviada' => $detalle['cantidad'],
                    'cantidad_recibida' => 0 // Aún no recibido
                ]);
            }

            return response()->json(['message' => 'Solicitud de traslado creada. Pendiente de aprobación.', 'data' => $traslado], 201);
        });
    }

    public function aprobar(Request $request, $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id) {
            $traslado = \App\Models\Operaciones\OperTraslado::with('detalles.producto')->findOrFail($id);

            if ($traslado->estado !== 'pendiente') {
                return response()->json(['error' => 'El traslado no está pendiente'], 400);
            }

            foreach ($traslado->detalles as $detalle) {
                // 1. Validar Stock Origen
                $stockOrigen = \App\Models\Inventario\InvBodegaProducto::where('bodega_id', $traslado->bodega_origen_id)
                                ->where('producto_id', $detalle->producto_id)
                                ->sum('existencia');

                if ($stockOrigen < $detalle->cantidad_enviada) {
                    throw new \Exception("Stock insuficiente para el producto: " . $detalle->producto->nombre);
                }

                // 2. Movimiento SALIDA (Origen)
                $this->kardexService->registrarMovimiento(
                    $traslado->bodega_origen_id,
                    $detalle->producto_id,
                    'traslado_salida',
                    $detalle->cantidad_enviada,
                    $detalle->producto->costo_promedio,
                    'TRASLADO-SALIDA',
                    $traslado->id
                );

                // 3. Movimiento ENTRADA (Destino)
                $this->kardexService->registrarMovimiento(
                    $traslado->bodega_destino_id,
                    $detalle->producto_id,
                    'traslado_entrada',
                    $detalle->cantidad_enviada,
                    $detalle->producto->costo_promedio,
                    'TRASLADO-ENTRADA',
                    $traslado->id
                );

                // Actualizar cantidad recibida (asumiendo recepción completa)
                $detalle->update(['cantidad_recibida' => $detalle->cantidad_enviada]);
            }

            $traslado->update([
                'estado' => 'recibido',
                'usuario_autoriza_id' => auth()->id(),
                'fecha_recepcion' => now()
            ]);

            return response()->json(['message' => 'Traslado aprobado y procesado correctamente']);
        });
    }

    public function rechazar(Request $request, $id)
    {
        $traslado = \App\Models\Operaciones\OperTraslado::findOrFail($id);
        if ($traslado->estado !== 'pendiente') {
            return response()->json(['error' => 'Solo se pueden rechazar traslados pendientes'], 400);
        }
        
        $traslado->update([
            'estado' => 'rechazado',
            'usuario_autoriza_id' => auth()->id()
        ]);
        
        return response()->json(['message' => 'Traslado rechazado']);
    }

    public function show($id)
    {
        return response()->json(
            \App\Models\Operaciones\OperTraslado::with(['bodegaOrigen', 'bodegaDestino', 'detalles.producto'])->findOrFail($id)
        );
    }
}
