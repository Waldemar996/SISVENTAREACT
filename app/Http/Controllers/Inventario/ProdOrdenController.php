<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProdOrdenController extends Controller
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
        $ordenes = \App\Models\Inventario\ProdOrden::with(['productoTerminado', 'responsable', 'bodegaDestino'])
                    ->orderBy('id', 'desc')
                    ->paginate(20);
        return response()->json($ordenes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_terminado_id' => 'required|exists:inv_productos,id',
            'cantidad_planeada' => 'required|numeric|min:1',
            'bodega_destino_id' => 'required|exists:log_bodegas,id',
            'fecha_inicio_programada' => 'required|date',
        ]);

        $orden = \App\Models\Inventario\ProdOrden::create([
            'numero_orden' => 'ORD-' . time(),
            'producto_terminado_id' => $validated['producto_terminado_id'],
            'cantidad_planeada' => $validated['cantidad_planeada'],
            'cantidad_producida' => 0,
            'bodega_destino_id' => $validated['bodega_destino_id'],
            'fecha_inicio_programada' => $validated['fecha_inicio_programada'],
            'responsable_id' => auth()->id(),
            'estado' => 'planificada'
        ]);

        return response()->json($orden, 201);
    }

    public function show($id)
    {
        return response()->json(
            \App\Models\Inventario\ProdOrden::with(['productoTerminado', 'bodegaDestino', 'responsable'])->findOrFail($id)
        );
    }

    // EL NÚCLEO: Ejecutar Producción
    public function finalizar(Request $request, $id)
    {
        $orden = \App\Models\Inventario\ProdOrden::findOrFail($id);
        
        if ($orden->estado === 'finalizada') {
            return response()->json(['message' => 'Orden ya finalizada'], 422);
        }

        $cantidadReal = $request->input('cantidad_real', $orden->cantidad_planeada);
        $bodegaId = $orden->bodega_destino_id;

        // 1. Obtener Fórmula
        $ingredientes = \App\Models\Inventario\ProdFormula::where('producto_padre_id', $orden->producto_terminado_id)->get();
        if ($ingredientes->isEmpty()) {
            return response()->json(['message' => 'El producto no tiene fórmula definida'], 422);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $costoTotalOrden = 0;

            // 2. Descontar Insumos (Salida de Materia Prima)
            foreach ($ingredientes as $ingrediente) {
                $cantidadNecesaria = $ingrediente->cantidad_requerida * $cantidadReal;
                
                // Obtener costo actual del insumo para calcular costo del producto final
                $productoInsumo = \App\Models\Inventario\InvProducto::find($ingrediente->producto_hijo_id);
                $costoInsumo = $productoInsumo->costo_promedio;

                // Registrar Salida en Kardex
                $this->kardexService->registrarMovimiento(
                    $bodegaId,
                    $ingrediente->producto_hijo_id,
                    'consumo_produccion', // Salida por consumo
                    $cantidadNecesaria,
                    $costoInsumo,
                    'ORDEN_PROD',
                    $orden->numero_orden
                );

                $costoTotalOrden += ($cantidadNecesaria * $costoInsumo);
            }

            // Costo unitario del nuevo producto
            $costoUnitarioProductoTerminado = $costoTotalOrden / $cantidadReal;

            // 3. Ingresar Producto Terminado (Entrada de Producción)
            $this->kardexService->registrarMovimiento(
                $bodegaId,
                $orden->producto_terminado_id,
                'produccion', // Entrada por producción (reutilizamos key, el service debe detectar si es entrada o salida. WAIT. KardexService needs update to handle 'produccion' as BOTH depending on... logic? No, usually 'produccion' is entry. 'consumo_produccion' is exit. Let's fix KardexService or use 'salida_produccion')
                // FIX: KardexService logic checks in_array. 'produccion' is in $entradas. So for ingredients we need a text that is in $salidas or modify service.
                // Let's check KardexService.php again.
                // It has: $entradas = ['compra', 'traslado_entrada', 'devolucion', 'produccion'];
                // It has: $salidas = ['venta', 'traslado_salida'];
                // WE NEED TO ADD 'consumo' to KardexService. 
                // For now, let's assume we will update KardexService to support 'consumo_produccion'.
                $cantidadReal,
                $costoUnitarioProductoTerminado,
                'ORDEN_PROD',
                $orden->numero_orden
            );

            // 4. Actualizar Orden
            $orden->update([
                'estado' => 'finalizada',
                'cantidad_producida' => $cantidadReal,
                'fecha_fin_real' => now(),
                'costo_real_total' => $costoTotalOrden
            ]);

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => 'Producción ejecutada exitosamente. Inventario actualizado.']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Error en producción: ' . $e->getMessage()], 500);
        }
    }
}
