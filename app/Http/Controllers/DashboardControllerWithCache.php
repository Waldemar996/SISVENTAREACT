<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // Cache duration in minutes
    const CACHE_DURATION = 5; // 5 minutes for dashboard stats

    const CACHE_KEY_PREFIX = 'dashboard_';

    public function index()
    {
        try {
            // Use cache for dashboard stats
            $stats = Cache::remember(
                self::CACHE_KEY_PREFIX.'stats_'.auth()->id(),
                now()->addMinutes(self::CACHE_DURATION),
                function () {
                    return [
                        'resumen' => $this->getResumenFInanciero(),
                        'graficaVentas' => $this->getDatosGrafica(),
                        'topProductos' => $this->getTopProductos(),
                        'ventasPorCategoria' => $this->getVentasPorCategoria(),
                        'productosCriticos' => $this->getProductosCriticos(),
                        'actividadReciente' => $this->getActividadReciente(),
                        'alertas' => $this->getAlertas(),
                    ];
                }
            );

            return Inertia::render('Dashboard', ['stats' => $stats]);
        } catch (\Exception $e) {
            Log::error('Error Dashboard: '.$e->getMessage());

            return Inertia::render('Dashboard', ['stats' => null]);
        }
    }

    /**
     * Clear dashboard cache (call this after creating venta/compra)
     */
    public static function clearCache($userId = null)
    {
        $userId = $userId ?? auth()->id();
        Cache::forget(self::CACHE_KEY_PREFIX.'stats_'.$userId);
    }

    /**
     * Clear all dashboard caches
     */
    public static function clearAllCaches()
    {
        Cache::flush(); // Or use tags if using Redis
    }

    // ... rest of the methods remain the same ...

    private function getResumenFInanciero()
    {
        $hoy = date('Y-m-d');
        $inicioMes = date('Y-m-01');
        $finMes = date('Y-m-t');

        // Mes anterior para comparaciones
        $inicioMesAnterior = date('Y-m-01', strtotime('-1 month'));
        $finMesAnterior = date('Y-m-t', strtotime('-1 month'));

        // 1. Ventas del Mes
        $ventasMes = DB::table('oper_ventas')
            ->whereDate('fecha_emision', '>=', $inicioMes)
            ->whereDate('fecha_emision', '<=', $finMes)
            ->where('estado', '!=', 'anulada')
            ->sum('total_venta');

        $ventasMesAnterior = DB::table('oper_ventas')
            ->whereDate('fecha_emision', '>=', $inicioMesAnterior)
            ->whereDate('fecha_emision', '<=', $finMesAnterior)
            ->where('estado', '!=', 'anulada')
            ->sum('total_venta');

        // 2. Ventas Hoy
        $ventasHoy = DB::table('oper_ventas')
            ->whereDate('fecha_emision', $hoy)
            ->where('estado', '!=', 'anulada')
            ->sum('total_venta');

        $cantidadVentasHoy = DB::table('oper_ventas')
            ->whereDate('fecha_emision', $hoy)
            ->where('estado', '!=', 'anulada')
            ->count();

        // 3. Valor Inventario
        $valorInventario = DB::table('inv_bodega_producto as bp')
            ->join('inv_productos as p', 'p.id', '=', 'bp.producto_id')
            ->select(DB::raw('SUM(bp.existencia * p.costo_promedio) as total'))
            ->value('total') ?? 0;

        // 4. Compras del Mes
        $comprasMes = DB::table('oper_compras')
            ->whereDate('fecha_emision', '>=', $inicioMes)
            ->whereDate('fecha_emision', '<=', $finMes)
            ->where('estado', 'COMPLETADO')
            ->sum('total_compra');

        $comprasMesAnterior = DB::table('oper_compras')
            ->whereDate('fecha_emision', '>=', $inicioMesAnterior)
            ->whereDate('fecha_emision', '<=', $finMesAnterior)
            ->where('estado', 'COMPLETADO')
            ->sum('total_compra');

        // 5. NUEVAS MÉTRICAS PRO

        // Margen Bruto del Mes (Ventas - Compras)
        $margenMes = $ventasMes - $comprasMes;
        $margenMesAnterior = $ventasMesAnterior - $comprasMesAnterior;

        // Ticket Promedio
        $cantidadVentasMes = DB::table('oper_ventas')
            ->whereDate('fecha_emision', '>=', $inicioMes)
            ->where('estado', '!=', 'anulada')
            ->count();

        $ticketPromedio = $cantidadVentasMes > 0 ? $ventasMes / $cantidadVentasMes : 0;

        // Calcular tendencias (% cambio)
        $tendenciaVentas = $this->calcularTendencia($ventasMes, $ventasMesAnterior);
        $tendenciaCompras = $this->calcularTendencia($comprasMes, $comprasMesAnterior);
        $tendenciaMargen = $this->calcularTendencia($margenMes, $margenMesAnterior);

        // 6. SPARKLINES - Datos de últimos 7 días para mini gráficos
        $sparklines = $this->getSparklineData();

        return [
            'ventas_mes' => (float) $ventasMes,
            'ventas_mes_anterior' => (float) $ventasMesAnterior,
            'tendencia_ventas' => $tendenciaVentas,
            'sparkline_ventas' => $sparklines['ventas'],

            'ventas_hoy' => (float) $ventasHoy,
            'cantidad_ventas_hoy' => $cantidadVentasHoy,

            'valor_inventario' => (float) $valorInventario,

            'compras_mes' => (float) $comprasMes,
            'compras_mes_anterior' => (float) $comprasMesAnterior,
            'tendencia_compras' => $tendenciaCompras,
            'sparkline_compras' => $sparklines['compras'],

            'margen_mes' => (float) $margenMes,
            'margen_mes_anterior' => (float) $margenMesAnterior,
            'tendencia_margen' => $tendenciaMargen,
            'sparkline_margen' => $sparklines['margen'],

            'ticket_promedio' => (float) $ticketPromedio,
            'cantidad_ventas_mes' => $cantidadVentasMes,
        ];
    }

    private function getSparklineData()
    {
        $datos = ['ventas' => [], 'compras' => [], 'margen' => []];

        for ($i = 6; $i >= 0; $i--) {
            $fecha = date('Y-m-d', strtotime("-$i days"));

            $ventaDia = DB::table('oper_ventas')
                ->whereDate('fecha_emision', $fecha)
                ->where('estado', '!=', 'anulada')
                ->sum('total_venta');

            $compraDia = DB::table('oper_compras')
                ->whereDate('fecha_emision', $fecha)
                ->where('estado', 'COMPLETADO')
                ->sum('total_compra');

            $datos['ventas'][] = (float) $ventaDia;
            $datos['compras'][] = (float) $compraDia;
            $datos['margen'][] = (float) ($ventaDia - $compraDia);
        }

        return $datos;
    }

    private function calcularTendencia($actual, $anterior)
    {
        if ($anterior == 0) {
            return [
                'porcentaje' => $actual > 0 ? 100 : 0,
                'direccion' => $actual > 0 ? 'up' : 'neutral',
            ];
        }

        $cambio = (($actual - $anterior) / $anterior) * 100;

        return [
            'porcentaje' => abs(round($cambio, 1)),
            'direccion' => $cambio > 0 ? 'up' : ($cambio < 0 ? 'down' : 'neutral'),
        ];
    }

    // ... other methods ...
}
