<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OperDevolucionController extends Controller
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
        return response()->json(
            \App\Models\Operaciones\OperDevolucion::with(['venta.cliente', 'usuario', 'detalles.producto'])
                ->orderBy('id', 'desc')
                ->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'venta_id' => 'required|exists:oper_ventas,id',
            'motivo' => 'required|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:inv_productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function() use ($validated, $request) {
            $venta = \App\Models\Operaciones\OperVenta::with('detalles')->findOrFail($validated['venta_id']);

            // ========== VALIDACIONES CRÍTICAS ==========
            
            // 1. Validar estado de la venta
            if ($venta->estado === 'ANULADO') {
                return response()->json([
                    'message' => 'No se puede procesar devolución de una venta anulada'
                ], 400);
            }

            if ($venta->estado !== 'COMPLETADO') {
                return response()->json([
                    'message' => 'Solo se pueden devolver ventas completadas'
                ], 400);
            }

            // 2. Validar límite de tiempo (30 días)
            $diasTranscurridos = now()->diffInDays($venta->fecha_emision);
            $diasMaximos = 30;
            
            if ($diasTranscurridos > $diasMaximos) {
                return response()->json([
                    'message' => "Las devoluciones solo se permiten dentro de {$diasMaximos} días. Esta venta tiene {$diasTranscurridos} días."
                ], 400);
            }

            // 3. Validar caja abierta
            $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', auth()->id())
                                ->where('estado', 'abierta')->first();
            
            if (!$sesionActiva) {
                return response()->json(['message' => 'Se requiere abrir caja para procesar el reembolso.'], 403);
            }

            // 4. Validar cada producto y cantidad
            foreach ($validated['detalles'] as $detalle) {
                // 4.1 Verificar que el producto existe en la venta original
                $detVenta = \App\Models\Operaciones\OperVentaDet::where('venta_id', $venta->id)
                                ->where('producto_id', $detalle['producto_id'])
                                ->first();
                
                if (!$detVenta) {
                    $producto = \App\Models\Inventario\InvProducto::find($detalle['producto_id']);
                    return response()->json([
                        'message' => "El producto '{$producto->nombre}' no existe en esta venta"
                    ], 400);
                }

                // 4.2 Calcular cantidad ya devuelta de este producto
                $cantidadYaDevuelta = \App\Models\Operaciones\OperDevolucionDet::whereHas('devolucion', function($q) use ($venta) {
                    $q->where('venta_origen_id', $venta->id)
                      ->where('estado', '!=', 'ANULADO');
                })->where('producto_id', $detalle['producto_id'])
                  ->sum('cantidad');

                // 4.3 Validar cantidad disponible
                $cantidadDisponible = $detVenta->cantidad - $cantidadYaDevuelta;
                
                if ($detalle['cantidad'] > $cantidadDisponible) {
                    $producto = \App\Models\Inventario\InvProducto::find($detalle['producto_id']);
                    return response()->json([
                        'message' => "Solo puede devolver {$cantidadDisponible} unidades de '{$producto->nombre}' (Vendido: {$detVenta->cantidad}, Ya devuelto: {$cantidadYaDevuelta})"
                    ], 400);
                }
            }

            // ========== CREAR DEVOLUCIÓN ==========
            
            $devolucion = \App\Models\Operaciones\OperDevolucion::create([
                'venta_origen_id' => $venta->id,
                'usuario_id' => auth()->id(),
                'sesion_caja_id' => $sesionActiva->id,
                'fecha_devolucion' => now(),
                'motivo' => $validated['motivo'],
                'monto_total' => 0, // Se calcula abajo
                'estado' => 'aprobada'
            ]);

            $totalReembolso = 0;

            foreach ($validated['detalles'] as $detalle) {
                $producto = \App\Models\Inventario\InvProducto::findOrFail($detalle['producto_id']);
                
                // Usar precio EXACTO de la venta original
                $detVenta = \App\Models\Operaciones\OperVentaDet::where('venta_id', $venta->id)
                                ->where('producto_id', $detalle['producto_id'])
                                ->first();
                
                $precioOriginal = $detVenta->precio_unitario;
                $subtotal = $precioOriginal * $detalle['cantidad'];
                $totalReembolso += $subtotal;

                // Crear Detalle Devolución
                $devolucion->detalles()->create([
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $precioOriginal,
                    'subtotal' => $subtotal
                ]);

                // KARDEX: ENTRADA (Retorno de Mercancía)
                $this->kardexService->registrarMovimiento(
                    $venta->bodega_id,
                    $detalle['producto_id'],
                    'devolucion', // Correcto según Enum de KardexService y DB
                    $detalle['cantidad'],
                    $producto->costo_promedio, 
                    'DEVOLUCION',
                    $devolucion->id
                );
            }

            $devolucion->update(['monto_total' => $totalReembolso]);

            // ========== AUDITORÍA ==========
            \App\Services\AuditService::log(
                'DEVOLUCIONES', 
                'CREAR', 
                'oper_devoluciones', 
                $devolucion->id, 
                null,
                [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero_comprobante,
                    'motivo' => $validated['motivo'],
                    'monto_reembolso' => $totalReembolso,
                    'productos_devueltos' => count($validated['detalles'])
                ]
            );

            return response()->json([
                'message' => 'Devolución procesada correctamente', 
                'data' => $devolucion->load('detalles')
            ], 201);
        });
    }

    public function show(string $id)
    {
        //
    }
}
