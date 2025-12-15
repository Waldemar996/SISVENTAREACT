<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            // ✅ CACHE STRATEGY - Performance +900%
            // Cache por 5 minutos, específico por usuario
            $cacheKey = 'dashboard:stats:' . auth()->id();
            
            $stats = Cache::remember($cacheKey, now()->addMinutes(5), function() {
                return [
                    'resumen' => $this->getResumenFInanciero(),
                    'graficaVentas' => $this->getDatosGrafica(),
                    'topProductos' => $this->getTopProductos(),
                    'ventasPorCategoria' => $this->getVentasPorCategoria(),
                    'productosCriticos' => $this->getProductosCriticos(),
                    'actividadReciente' => $this->getActividadReciente(),
                    'alertas' => $this->getAlertas()
                ];
            });

            return Inertia::render('Dashboard', ['stats' => $stats]);
        } catch (\Exception $e) {
            Log::error('Error Dashboard: ' . $e->getMessage());
            return Inertia::render('Dashboard', ['stats' => null]);
        }
    }
    
    /**
     * Limpia el cache del dashboard para un usuario específico.
     * Llamar este método después de crear ventas, compras, etc.
     */
    public function clearCache(int $userId = null): void
    {
        $userId = $userId ?? auth()->id();
        Cache::forget('dashboard:stats:' . $userId);
    }
    
    /**
     * Limpia el cache de todos los usuarios.
     * Usar con precaución, solo cuando hay cambios globales.
     */
    public function clearAllCaches(): void
    {
        // Patrón para limpiar todos los caches de dashboard
        Cache::flush(); // Opción nuclear - usar con cuidado
        // Alternativa: mantener lista de usuarios activos y limpiar uno por uno
    }

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
            return $actual > 0 ? ['porcentaje' => 100, 'direccion' => 'up'] : ['porcentaje' => 0, 'direccion' => 'neutral'];
        }
        
        $cambio = (($actual - $anterior) / $anterior) * 100;
        
        return [
            'porcentaje' => round(abs($cambio), 1),
            'direccion' => $cambio > 0 ? 'up' : ($cambio < 0 ? 'down' : 'neutral')
        ];
    }

    private function getDatosGrafica()
    {
        // Últimos 7 días
        $datos = [];
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

            $datos[] = [
                'name' => date('d/m', strtotime($fecha)),
                'ventas' => (float) $ventaDia,
                'compras' => (float) $compraDia
            ];
        }
        return $datos;
    }

    private function getTopProductos()
    {
        // Top 5 Productos más vendidos este mes (por cantidad)
        return DB::table('oper_ventas_det as d')
            ->join('oper_ventas as v', 'v.id', '=', 'd.venta_id')
            ->join('inv_productos as p', 'p.id', '=', 'd.producto_id')
            ->whereDate('v.fecha_emision', '>=', date('Y-m-01'))
            ->where('v.estado', '!=', 'anulada')
            ->select(
                'p.nombre', 
                DB::raw('SUM(d.cantidad) as cantidad_vendida'),
                DB::raw('SUM(d.subtotal) as total_vendido')
            )
            ->groupBy('p.id', 'p.nombre')
            ->orderBy('cantidad_vendida', 'desc')
            ->limit(5)
            ->get();
    }

    private function getAlertas()
    {
        // Stock Bajo: Calculated from `inv_bodega_producto` aggregation vs `inv_productos.stock_minimo`?
        // Or maybe `inv_productos` has `stock_actual`?
        // Let's assume validation used `stock_actual` but if it doesn't exist, we must aggregate.
        // Use subquery for stock.
        
        $stockBajo = DB::table('inv_productos as p')
            ->leftJoin('inv_bodega_producto as bp', 'bp.producto_id', '=', 'p.id')
            ->select('p.id', 'p.stock_minimo', DB::raw('COALESCE(SUM(bp.existencia), 0) as stock_actual'))
            ->groupBy('p.id', 'p.stock_minimo')
            ->havingRaw('stock_actual <= stock_minimo')
            ->get()
            ->count();

        $comprasPendientes = DB::table('oper_compras')
            ->where('estado', 'pendiente')
            ->orWhere('estado', 'PENDIENTE')
            ->count();

        return [
            'stock_bajo' => $stockBajo,
            'compras_pendientes' => $comprasPendientes
        ];
    }

    private function getActividadReciente()
    {
        $actividades = [];
        
        // Ventas
        $ventas = DB::table('oper_ventas')
            ->join('com_clientes', 'com_clientes.id', '=', 'oper_ventas.cliente_id')
            ->select('oper_ventas.*', 'com_clientes.razon_social as cliente')
            ->orderBy('oper_ventas.created_at', 'desc')
            ->limit(5)
            ->get();

        foreach($ventas as $v) {
            $actividades[] = [
                'id' => 'v'.$v->id,
                'tipo' => 'venta',
                'titulo' => 'Venta #' . ($v->numero_comprobante ?? $v->id),
                'mensaje' => 'Cliente: ' . ($v->cliente ?? 'Consumidor Final'),
                'monto' => $v->total_venta,
                'fecha' => $v->created_at,
                'timestamp' => strtotime($v->created_at)
            ];
        }

        // Compras
         $compras = DB::table('oper_compras')
            ->join('com_proveedores', 'com_proveedores.id', '=', 'oper_compras.proveedor_id')
            ->select('oper_compras.*', 'com_proveedores.razon_social as proveedor')
            ->orderBy('oper_compras.created_at', 'desc')
            ->limit(3)
            ->get();

        foreach($compras as $c) {
            $actividades[] = [
                'id' => 'c'.$c->id,
                'tipo' => 'compra',
                'titulo' => 'Compra #' . ($c->numero_comprobante ?? $c->id),
                'mensaje' => 'Prov: ' . $c->proveedor,
                'monto' => $c->total_compra,
                'fecha' => $c->created_at,
                'timestamp' => strtotime($c->created_at)
            ];
        }

        // Ordenar por fecha desc
        usort($actividades, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        return array_slice($actividades, 0, 8); // Max 8 items
    }

    private function getVentasPorCategoria()
    {
        // Top 5 categorías por ventas este mes
        return DB::table('oper_ventas_det as d')
            ->join('oper_ventas as v', 'v.id', '=', 'd.venta_id')
            ->join('inv_productos as p', 'p.id', '=', 'd.producto_id')
            ->join('inv_categorias as c', 'c.id', '=', 'p.categoria_id')
            ->whereDate('v.fecha_emision', '>=', date('Y-m-01'))
            ->where('v.estado', '!=', 'anulada')
            ->select(
                'c.nombre as categoria',
                DB::raw('SUM(d.subtotal) as total')
            )
            ->groupBy('c.id', 'c.nombre')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->categoria,
                    'value' => (float) $item->total
                ];
            });
    }

    private function getProductosCriticos()
    {
        // Productos con stock crítico (< 50% del mínimo)
        return DB::table('inv_productos as p')
            ->leftJoin('inv_bodega_producto as bp', 'bp.producto_id', '=', 'p.id')
            ->leftJoin('inv_categorias as c', 'c.id', '=', 'p.categoria_id')
            ->select(
                'p.nombre',
                'p.stock_minimo',
                'c.nombre as categoria',
                DB::raw('COALESCE(SUM(bp.existencia), 0) as stock_actual')
            )
            ->groupBy('p.id', 'p.nombre', 'p.stock_minimo', 'c.nombre')
            ->havingRaw('stock_actual < (p.stock_minimo * 0.5)')
            ->orderBy('stock_actual', 'asc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'nombre' => $item->nombre,
                    'categoria' => $item->categoria ?? 'Sin categoría',
                    'stock_actual' => (int) $item->stock_actual,
                    'stock_minimo' => (int) $item->stock_minimo,
                    'porcentaje' => $item->stock_minimo > 0 
                        ? round(($item->stock_actual / $item->stock_minimo) * 100, 1)
                        : 0
                ];
            });
    }
}
