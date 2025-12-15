<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OperCompraController extends Controller
{

    protected $kardexService;

    public function __construct(\App\Services\KardexService $kardexService)
    {
        $this->kardexService = $kardexService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $compras = \App\Models\Operaciones\OperCompra::with(['proveedor', 'usuario'])->withCount('detalles')->orderBy('fecha_emision', 'desc')->paginate(15);
        return response()->json($compras);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bodega_id' => 'required|exists:log_bodegas,id', 
            'proveedor_id' => 'required|exists:com_proveedores,id',
            'tipo_comprobante' => 'required|in:FACTURA,BOLETA,GUIA',
            'numero_factura' => 'nullable|string|max:50', // Add validation
            'metodo_pago' => 'required|in:contado,credito', // Add method validation
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:inv_productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.costo_unitario' => 'required|numeric|min:0.01' // Validate Cost > 0
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function() use ($validated, $request) {
            $subtotal = 0;
            foreach($validated['detalles'] as $detalle) {
                $subtotal += $detalle['cantidad'] * $detalle['costo_unitario'];
            }
            $total = $subtotal; 

            // 1. Crear Compra
            $estadoInicial = $request->input('estado', 'PENDIENTE');

            $compra = \App\Models\Operaciones\OperCompra::create([
                'proveedor_id' => $validated['proveedor_id'],
                'usuario_id' => auth()->id() ?? 1,
                'bodega_id' => $validated['bodega_id'], 
                'numero_comprobante' => 'C-' . date('YmdHis') . '-' . rand(100, 999),
                'numero_factura' => $validated['numero_factura'] ?? null,
                'tipo_comprobante' => $validated['tipo_comprobante'],
                'fecha_emision' => $request->input('fecha_compra', now()), // Use frontend date if provided
                'subtotal' => $subtotal,
                'total_impuestos' => 0,
                'total_compra' => $total,
                'estado' => $estadoInicial
            ]);

            // 2. Detalles
            foreach($validated['detalles'] as $detalle) {
                $compra->detalles()->create([
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'costo_unitario' => $detalle['costo_unitario'],
                    'subtotal' => $detalle['cantidad'] * $detalle['costo_unitario']
                ]);

                // 3. Movimiento de Inventario ONLY IF COMPLETADO
                if ($estadoInicial === 'COMPLETADO') {
                    $this->kardexService->registrarMovimiento(
                        $validated['bodega_id'],
                        $detalle['producto_id'],
                        'compra',
                        $detalle['cantidad'],
                        $detalle['costo_unitario'],
                        'COMPRAS',
                        $compra->id
                    );
                }
            }
            
            // Audit
            \App\Services\AuditService::log('COMPRAS', 'CREAR', 'oper_compras', $compra->id, null, ['total' => $total, 'estado' => $estadoInicial]);

            return response()->json(['message' => 'Compra registrada exitosamente', 'data' => $compra], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $compra = \App\Models\Operaciones\OperCompra::with(['proveedor', 'detalles.producto'])->findOrFail($id);
        return response()->json($compra);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        \App\Services\AuditService::log('COMPRAS', 'INTENTO_EDITAR', 'oper_compras', $id, null, ['motivo' => 'Accion prohibida']);
        return response()->json(['message' => 'No es posible editar compras procesadas por integridad contable. Anule y vuelva a crear.'], 403);
    }

    public function recibir(string $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id) {
            try {
                $compra = \App\Models\Operaciones\OperCompra::with('detalles')->findOrFail($id);

                if ($compra->estado !== 'PENDIENTE') {
                    return response()->json(['message' => 'Solo se pueden recibir compras pendientes'], 400);
                }

                foreach($compra->detalles as $detalle) {
                    // Registrar Entrada de Stock
                    $this->kardexService->registrarMovimiento(
                        $compra->bodega_id,
                        $detalle->producto_id,
                        'compra',
                        $detalle->cantidad,
                        $detalle->costo_unitario,
                        'COMPRA RECIBIDA',
                        $compra->id
                    );
                }

                $compra->update(['estado' => 'COMPLETADO']);
                
                \App\Services\AuditService::log('COMPRAS', 'RECIBIR', 'oper_compras', $compra->id, ['prev_estado' => 'PENDIENTE'], null);

                return response()->json(['message' => 'Mercadería recibida y stock actualizado']);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Error al recibir mercadería: ' . $e->getMessage()], 400);
            }
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id) {
            try {
                $compra = \App\Models\Operaciones\OperCompra::with('detalles')->findOrFail($id);
                
                if ($compra->estado === 'ANULADO') {
                    return response()->json(['message' => 'La compra ya está anulada'], 400);
                }

                // 1. Revertir Stock (Solo si ya estaba COMPLETADO)
                if ($compra->estado === 'COMPLETADO') {
                    foreach($compra->detalles as $detalle) {
                        $this->kardexService->registrarMovimiento(
                            $compra->bodega_id,
                            $detalle->producto_id,
                            'devolucion_compra', // Valid type now
                            $detalle->cantidad,
                            $detalle->costo_unitario,
                            'ANULACION COMPRA ' . $compra->numero_comprobante,
                            $compra->id
                        );
                    }
                }

                // 2. Actualizar Estado
                $compra->update(['estado' => 'ANULADO']);

                // 3. Auditoría
                \App\Services\AuditService::log('COMPRAS', 'ANULAR', 'oper_compras', $id, ['motivo' => 'Anulación manual usuario', 'estado_previo' => $compra->estado], null);

                return response()->json(['message' => 'Compra anulada correctamente']);
            } catch (\Exception $e) {
                // Return 400 for business logic errors
                return response()->json(['message' => 'No se pudo anular la compra: ' . $e->getMessage()], 400);
            }
        });
    }
}
