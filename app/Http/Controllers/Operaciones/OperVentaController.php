<?php

namespace App\Http\Controllers\Operaciones;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OperVentaController extends Controller
{
    protected $createVentaService;

    public function __construct(
        \App\Services\KardexService $kardexService,
        \App\Application\Sales\CreateVentaService $createVentaService
    ) {
        $this->kardexService = $kardexService;
        $this->createVentaService = $createVentaService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $ventas = \App\Models\Operaciones\OperVenta::with(['cliente', 'usuario', 'detalles'])->orderBy('created_at', 'desc')->get();

        return response()->json($ventas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'required|exists:com_clientes,id',
            'bodega_id' => 'nullable|exists:log_bodegas,id',
            'tipo_comprobante' => 'required|in:FACTURA,BOLETA,TICKET',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:inv_productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        $bodegaId = $request->input('bodega_id', 1);

        try {
            // 0. SESSION Resolution (Legacy Logic kept for compatibility/testing)
            $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', auth()->id())
                ->where('estado', 'abierta')
                ->first();

            if (! $sesionActiva) {
                // Auto-open for Admin (Legacy behavior for tests)
                $caja = \App\Models\Tesoreria\TesCaja::first();
                if ($caja) {
                    $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::create([
                        'caja_id' => $caja->id,
                        'usuario_id' => auth()->id(),
                        'fecha_apertura' => now(),
                        'monto_inicial' => 0,
                        'estado' => 'abierta',
                    ]);
                } else {
                    throw new \Exception('No hay caja disponible para abrir sesión.');
                }
            }

            // 1. Prepare DTO
            $dtoData = [
                'cliente_id' => $validated['cliente_id'],
                'bodega_id' => $bodegaId,
                'sesion_caja_id' => $sesionActiva->id,
                'metodo_pago' => $request->input('forma_pago', 'contado'), // Map correctly
                'detalles' => $validated['detalles'],
            ];

            $dto = new \App\Application\Sales\CreateVentaDTO($dtoData);

            // 2. Execute Service
            // TransactionMiddleware handles DB Transaction
            $ventaEntity = $this->createVentaService->execute($dto);
            $ventaId = $ventaEntity->getId();

            // 3. Load Model for Response/Audit (Legacy Format)
            // Ideally Service returns a ResultDTO, but here we Bridge to Eloquent for response
            $ventaModel = \App\Models\Operaciones\OperVenta::with('detalles')->find($ventaId);

            // 4. Audit (Legacy Static Call)
            // Note: Total is calculated in Domain, but we access it via Model for consistency with legacy log
            \App\Services\AuditService::log('VENTAS', 'CREAR', 'oper_ventas', $ventaId, null, ['total' => $ventaModel->total_venta]);

            return response()->json([
                'message' => 'Venta registrada correctamente',
                'id' => $ventaId,
                'data' => $ventaModel,
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $venta = \App\Models\Operaciones\OperVenta::with(['cliente', 'usuario', 'detalles.producto'])->findOrFail($id);

        return response()->json($venta);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        return response()->json(['message' => 'Las ventas no se pueden editar directamente, utilice notas de crédito.'], 403);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $venta = \App\Models\Operaciones\OperVenta::with('detalles')->findOrFail($id);

            if ($venta->estado === 'ANULADO') {
                return response()->json(['message' => 'La venta ya está anulada'], 400);
            }

            // 1. Revertir Stock (Kardex: Entrada por Devolución/Anulación)
            foreach ($venta->detalles as $detalle) {
                $this->kardexService->registrarMovimiento(
                    $venta->bodega_id,
                    $detalle->producto_id,
                    'entrada', // Entrada por anulación de venta
                    $detalle->cantidad,
                    $detalle->costo_unitario_historico,
                    'ANULACION VENTA '.$venta->numero_comprobante,
                    $venta->id
                );
            }

            // 2. Actualizar Estado
            $venta->update(['estado' => 'ANULADO']);

            // 3. Auditoría
            \App\Services\AuditService::log('VENTAS', 'ANULAR', 'oper_ventas', $id, ['motivo' => 'Anulación manual usuario'], null);

            return response()->json(['message' => 'Venta anulada y stock devuelto correctamente']);
        });
    }

    /**
     * Print the specified resource (Ticket/Invoice).
     */
    public function print($id)
    {
        $venta = \App\Models\Operaciones\OperVenta::with(['cliente', 'usuario', 'detalles.producto'])->findOrFail($id);
        $empresa = \App\Models\Config\SysConfiguracion::first();

        // Ensure user has access or public logic? Usually protected by auth.
        // We render an Inertia page for printing.
        return \Inertia\Inertia::render('Operaciones/Ventas/Print', [
            'venta' => $venta,
            'empresa' => $empresa,
        ]);
    }

    /**
     * Print the specified resource as Ticket (Thermal).
     */
    /**
     * Print the specified resource as Ticket (Thermal).
     */
    public function ticket($id)
    {
        $venta = \App\Models\Operaciones\OperVenta::with(['cliente', 'usuario', 'detalles.producto'])->findOrFail($id);
        $empresa = \App\Models\Config\SysConfiguracion::first();

        return \Inertia\Inertia::render('Operaciones/Ventas/Ticket', [
            'venta' => $venta,
            'empresa' => $empresa,
        ]);
    }

    /**
     * Search sale by invoice number for returns.
     */
    /**
     * Search sale by invoice number for returns.
     */
    public function search(Request $request)
    {
        // MODE 1: Get Full Details by ID (When user clicks a suggestion)
        if ($request->has('id')) {
            $venta = \App\Models\Operaciones\OperVenta::with(['cliente', 'detalles.producto', 'devoluciones.detalles'])
                ->findOrFail($request->query('id'));

            // Calculate available quantities
            $detalles = $venta->detalles->map(function ($det) use ($venta) {
                $cantidadDevuelta = 0;
                foreach ($venta->devoluciones as $dev) {
                    if ($dev->estado !== 'ANULADO') {
                        foreach ($dev->detalles as $devDet) {
                            if ($devDet->producto_id === $det->producto_id) {
                                $cantidadDevuelta += $devDet->cantidad;
                            }
                        }
                    }
                }

                return [
                    'producto_id' => $det->producto_id,
                    'producto_nombre' => $det->producto->nombre,
                    'cantidad_original' => $det->cantidad,
                    'cantidad_devuelta' => $cantidadDevuelta,
                    'cantidad_disponible' => max(0, $det->cantidad - $cantidadDevuelta),
                    'precio_unitario' => $det->precio_unitario,
                ];
            });

            return response()->json([
                'id' => $venta->id,
                'numero_comprobante' => $venta->numero_comprobante,
                'cliente' => $venta->cliente,
                'fecha_emision' => $venta->fecha_emision->format('Y-m-d'),
                'detalles' => $detalles,
            ]);
        }

        // MODE 2: Autocomplete Search (By Number)
        $numero = $request->query('numero');
        if (! $numero) {
            return response()->json([]);
        }

        $ventas = \App\Models\Operaciones\OperVenta::with('cliente')
            ->where('numero_comprobante', 'LIKE', "%{$numero}%")
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json($ventas->map(function ($v) {
            return [
                'id' => $v->id,
                'text' => $v->numero_comprobante.' - '.($v->cliente->razon_social ?? 'Consumidor Final'),
                'numero' => $v->numero_comprobante, // For display
                'cliente' => $v->cliente->razon_social ?? 'CF',
            ];
        }));
    }
    /**
     * Calculate Totals for Frontend (Pre-validation).
     */
    public function calculateTotals(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.producto_id' => 'required|exists:inv_productos,id',
            'items.*.cantidad' => 'required|numeric|min:0.1',
        ]);

        $subtotal = 0;
        $impuestos = 0;
        $total = 0;

        foreach ($validated['items'] as $item) {
            $producto = \App\Models\Inventario\InvProducto::with('impuesto')->find($item['producto_id']);
            if (!$producto) continue;

            $precio = $producto->precio_venta_base;
            $cantidad = $item['cantidad'];
            
            $lineSubtotal = $precio * $cantidad;
            
            // Tax Calculation (Simplified, usually in Domain)
            $taxRate = $producto->impuesto ? ($producto->impuesto->porcentaje / 100) : 0;
            $lineTax = $lineSubtotal * $taxRate;

            $subtotal += $lineSubtotal;
            $impuestos += $lineTax;
        }

        $total = $subtotal + $impuestos;

        return response()->json([
            'subtotal' => round($subtotal, 2),
            'impuestos' => round($impuestos, 2),
            'total' => round($total, 2),
            'currency' => 'GTQ'
        ]);
    }
}
