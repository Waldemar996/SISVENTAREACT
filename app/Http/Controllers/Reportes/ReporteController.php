<?php

namespace App\Http\Controllers\Reportes;

use App\Http\Controllers\Controller;
use App\Models\Inventario\InvProducto;
use App\Models\Operaciones\OperCompra;
use App\Models\Operaciones\OperVenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    public function dashboard()
    {
        try {
            // 1. KPIs Generales (Totales Históricos)
            $totalVentas = OperVenta::where('estado', 'COMPLETADO')->sum('total_venta');
            $totalCompras = OperCompra::where('estado', 'COMPLETADO')->sum('total_compra');

            // Ganancia aproximada: Ventas - Costo de lo Vendido (COGS).
            // Para exactitud real se requiere relacionar cada linea de venta con su costo histórico exacto.
            // Aquí usaremos una aproximación sumando los 'total_linea' - 'costo_total' presumido o simplemente Margen Bruto si tuviéramos costo en venta
            // Dado que guardamos 'costo_unitario_historico' en oper_ventas_det, podemos calcularlo exacto.

            $costoVentas = DB::table('oper_ventas_det')
                ->join('oper_ventas', 'oper_ventas.id', '=', 'oper_ventas_det.venta_id')
                ->where('oper_ventas.estado', 'COMPLETADO')
                ->sum(DB::raw('oper_ventas_det.cantidad * oper_ventas_det.costo_unitario_historico'));

            $gananciaBruta = $totalVentas - $costoVentas;

            // Productos bajo stock mínimo
            // Check if InvBodegaProducto model works correctly
            $productosBajoStock = InvProducto::where('activo', true)
                ->with('bodegaProductos')
                ->get()
                ->filter(function ($prod) {
                    $stockTotal = $prod->bodegaProductos ? $prod->bodegaProductos->sum('existencia') : 0;

                    return $stockTotal <= $prod->stock_minimo;
                })
                ->count();

            // 2. Gráfico: Ventas últimos 7 días
            $ventasUltimos7Dias = OperVenta::where('estado', 'COMPLETADO')
                ->where('fecha_emision', '>=', now()->subDays(7))
                ->select(
                    DB::raw('DATE(fecha_emision) as fecha'),
                    DB::raw('SUM(total_venta) as total')
                )
                ->groupBy('fecha')
                ->orderBy('fecha', 'asc')
                ->get();

            // 3. Gráfico: Top 5 Productos Más Vendidos
            $topProductos = DB::table('oper_ventas_det')
                ->join('oper_ventas', 'oper_ventas.id', '=', 'oper_ventas_det.venta_id')
                ->join('inv_productos', 'inv_productos.id', '=', 'oper_ventas_det.producto_id')
                ->where('oper_ventas.estado', 'COMPLETADO')
                ->select(
                    'inv_productos.nombre',
                    DB::raw('SUM(oper_ventas_det.cantidad) as total_vendido')
                )
                ->groupBy('inv_productos.id', 'inv_productos.nombre')
                ->orderByDesc('total_vendido')
                ->limit(5)
                ->get();

            return response()->json([
                'kpis' => [
                    'ventas_totales' => $totalVentas,
                    'compras_totales' => $totalCompras,
                    'ganancia_bruta' => $gananciaBruta,
                    'productos_bajo_stock' => $productosBajoStock,
                ],
                'charts' => [
                    'ventas_semanales' => $ventasUltimos7Dias,
                    'top_productos' => $topProductos,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error Dashboard: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Reporte de Ventas Detalladas
     */
    public function getVentasDetalladas(Request $request)
    {
        $query = OperVenta::with(['cliente', 'usuario', 'detalles.producto'])
            ->orderBy('fecha_emision', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('forma_pago')) {
            $query->where('forma_pago', $request->forma_pago);
        }

        // Export mode vs Pagination
        if ($request->query('export') === 'true') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Reporte de Compras Detalladas
     */
    public function getComprasDetalladas(Request $request)
    {
        $query = OperCompra::with(['proveedor', 'usuario', 'detalles.producto'])
            ->orderBy('fecha_emision', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Export mode vs Pagination
        if ($request->query('export') === 'true') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Reporte de Historial de Cajas
     */
    public function getHistorialCajas(Request $request)
    {
        $query = \App\Models\Tesoreria\TesSesionCaja::with(['usuario', 'caja'])
            ->orderBy('fecha_apertura', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_apertura', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_apertura', '<=', $request->fecha_fin);
        }

        if ($request->query('export') === 'true') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Reporte de Kardex
     */
    public function getKardex(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|exists:inv_productos,id',
        ]);

        $query = \App\Models\Inventario\InvKardex::with(['bodega', 'producto'])
            ->where('producto_id', $request->producto_id)
            ->orderBy('fecha', 'desc');

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha', '<=', $request->fecha_fin);
        }

        if ($request->query('export') === 'true') {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(50));
    }

    /**
     * Reporte de Inventario Valorizado
     */
    public function getInventarioValorizado(Request $request)
    {
        $query = InvProducto::with(['categoria', 'marca', 'bodegaProductos.bodega'])
            ->where('activo', true)
            ->whereHas('bodegaProductos', function ($q) {
                $q->where('existencia', '>', 0);
            });

        // Calculate Totals on the fly (or via DB raw for performance)
        $productos = $query->get()->map(function ($prod) {
            $stock = $prod->stock_total;
            $valor = $stock * $prod->costo_promedio;

            return [
                'id' => $prod->id,
                'codigo_sku' => $prod->codigo_sku,
                'nombre' => $prod->nombre,
                'categoria' => $prod->categoria->nombre ?? 'N/A',
                'stock_total' => $stock,
                'costo_promedio' => $prod->costo_promedio,
                'valor_total' => $valor,
            ];
        });

        if ($request->filled('categoria_id')) {
            $productos = $productos->where('categoria_id', $request->categoria_id);
        }

        return response()->json([
            'data' => $productos->values(),
            'total_valorizado' => $productos->sum('valor_total'),
        ]);
    }

    /**
     * Reporte de Cuentas por Cobrar
     */
    public function getCuentasPorCobrar(Request $request)
    {
        // Ventas al crédito pendientes
        // Asumimos que PENDIENTE significa que falta pago
        // Idealmente deberiamos restar los pagos realizados (FinPagoCliente).

        $ventas = OperVenta::with(['cliente'])
            ->where('estado', 'PENDIENTE')
            ->orderBy('fecha_emision', 'asc')
            ->get()
            ->map(function ($venta) {
                $pagado = \App\Models\Finanzas\FinPagoCliente::where('venta_id', $venta->id)->sum('monto');

                return [
                    'id' => $venta->id,
                    'fecha' => $venta->fecha_emision,
                    'cliente' => $venta->cliente->razon_social ?? 'Consumidor',
                    'total' => $venta->total_venta,
                    'pagado' => $pagado,
                    'saldo' => $venta->total_venta - $pagado,
                    'dias_mora' => \Carbon\Carbon::parse($venta->fecha_emision)->diffInDays(now()),
                ];
            })
            ->filter(function ($row) {
                return $row['saldo'] > 0;
            });

        return response()->json([
            'data' => $ventas->values(),
            'total_cxc' => $ventas->sum('saldo'),
        ]);
    }
}
