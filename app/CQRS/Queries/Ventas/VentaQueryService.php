<?php

namespace App\CQRS\Queries\Ventas;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Query Service - Solo LECTURAS desde Read Model
 *
 * CQRS: Separación de Commands (escrituras) y Queries (lecturas)
 *
 * Ventajas:
 * - Queries ultra-rápidas (read model optimizado)
 * - Cache agresivo (no afecta escrituras)
 * - Escalable (read replicas)
 */
class VentaQueryService
{
    /**
     * Obtiene ventas con filtros
     */
    public function getVentas(array $filters = []): array
    {
        $cacheKey = 'ventas:query:'.md5(json_encode($filters));

        return Cache::remember($cacheKey, 300, function () use ($filters) {
            $query = DB::table('ventas_read_model');

            // Filtros
            if (isset($filters['cliente_id'])) {
                $query->where('cliente_id', $filters['cliente_id']);
            }

            if (isset($filters['usuario_id'])) {
                $query->where('usuario_id', $filters['usuario_id']);
            }

            if (isset($filters['estado'])) {
                $query->where('estado', $filters['estado']);
            }

            if (isset($filters['desde'])) {
                $query->where('fecha_venta', '>=', $filters['desde']);
            }

            if (isset($filters['hasta'])) {
                $query->where('fecha_venta', '<=', $filters['hasta']);
            }

            if (isset($filters['forma_pago'])) {
                $query->where('forma_pago', $filters['forma_pago']);
            }

            // Búsqueda por número
            if (isset($filters['numero'])) {
                $query->where('numero_comprobante', 'LIKE', "%{$filters['numero']}%");
            }

            // Ordenamiento
            $orderBy = $filters['order_by'] ?? 'fecha_emision';
            $orderDir = $filters['order_dir'] ?? 'desc';
            $query->orderBy($orderBy, $orderDir);

            // Paginación
            $limit = $filters['limit'] ?? 50;
            $offset = $filters['offset'] ?? 0;

            return $query->limit($limit)->offset($offset)->get()->toArray();
        });
    }

    /**
     * Obtiene una venta por ID
     */
    public function getVentaById(int $ventaId): ?object
    {
        return Cache::remember("venta:{$ventaId}", 3600, function () use ($ventaId) {
            return DB::table('ventas_read_model')
                ->where('venta_id', $ventaId)
                ->first();
        });
    }

    /**
     * Busca ventas por cliente
     */
    public function getVentasPorCliente(int $clienteId, ?Carbon $desde = null, ?Carbon $hasta = null): array
    {
        $query = DB::table('ventas_read_model')
            ->where('cliente_id', $clienteId)
            ->where('estado', '!=', 'ANULADO');

        if ($desde) {
            $query->where('fecha_venta', '>=', $desde->toDateString());
        }

        if ($hasta) {
            $query->where('fecha_venta', '<=', $hasta->toDateString());
        }

        return $query->orderBy('fecha_emision', 'desc')->get()->toArray();
    }

    /**
     * Estadísticas rápidas
     */
    public function getEstadisticas(?Carbon $desde = null, ?Carbon $hasta = null): array
    {
        $cacheKey = "ventas:stats:{$desde}:{$hasta}";

        return Cache::remember($cacheKey, 600, function () use ($desde, $hasta) {
            $query = DB::table('ventas_read_model')
                ->where('estado', '!=', 'ANULADO');

            if ($desde) {
                $query->where('fecha_venta', '>=', $desde->toDateString());
            }

            if ($hasta) {
                $query->where('fecha_venta', '<=', $hasta->toDateString());
            }

            return [
                'total_ventas' => $query->count(),
                'total_monto' => $query->sum('total'),
                'promedio_venta' => $query->avg('total'),
                'venta_maxima' => $query->max('total'),
                'venta_minima' => $query->min('total'),
                'total_items' => $query->sum('cantidad_items'),
                'total_productos' => $query->sum('cantidad_total_productos'),
                'por_forma_pago' => DB::table('ventas_read_model')
                    ->select('forma_pago', DB::raw('COUNT(*) as cantidad'), DB::raw('SUM(total) as monto'))
                    ->where('estado', '!=', 'ANULADO')
                    ->when($desde, fn ($q) => $q->where('fecha_venta', '>=', $desde->toDateString()))
                    ->when($hasta, fn ($q) => $q->where('fecha_venta', '<=', $hasta->toDateString()))
                    ->groupBy('forma_pago')
                    ->get()
                    ->toArray(),
            ];
        });
    }

    /**
     * Top clientes
     */
    public function getTopClientes(int $limit = 10, ?Carbon $desde = null): array
    {
        $query = DB::table('ventas_read_model')
            ->select(
                'cliente_id',
                'cliente_nombre',
                'cliente_nit',
                DB::raw('COUNT(*) as total_compras'),
                DB::raw('SUM(total) as total_gastado'),
                DB::raw('AVG(total) as promedio_compra')
            )
            ->where('estado', '!=', 'ANULADO');

        if ($desde) {
            $query->where('fecha_venta', '>=', $desde->toDateString());
        }

        return $query->groupBy('cliente_id', 'cliente_nombre', 'cliente_nit')
            ->orderBy('total_gastado', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Productos más vendidos (desde JSON)
     */
    public function getProductosMasVendidos(int $limit = 10, ?Carbon $desde = null): array
    {
        // Esta query es más compleja porque los productos están en JSON
        // En producción, considera tener una tabla separada para esto

        $ventas = DB::table('ventas_read_model')
            ->select('productos')
            ->where('estado', '!=', 'ANULADO')
            ->when($desde, fn ($q) => $q->where('fecha_venta', '>=', $desde->toDateString()))
            ->get();

        $productosCount = [];

        foreach ($ventas as $venta) {
            $productos = json_decode($venta->productos, true);
            foreach ($productos as $producto) {
                $id = $producto['id'];
                if (! isset($productosCount[$id])) {
                    $productosCount[$id] = [
                        'producto_id' => $id,
                        'nombre' => $producto['nombre'],
                        'codigo_sku' => $producto['codigo_sku'],
                        'cantidad_vendida' => 0,
                        'total_vendido' => 0,
                    ];
                }
                $productosCount[$id]['cantidad_vendida'] += $producto['cantidad'];
                $productosCount[$id]['total_vendido'] += $producto['subtotal'];
            }
        }

        // Ordenar y limitar
        usort($productosCount, fn ($a, $b) => $b['cantidad_vendida'] <=> $a['cantidad_vendida']);

        return array_slice($productosCount, 0, $limit);
    }

    /**
     * Limpia cache de queries
     */
    public function clearCache(): void
    {
        // En producción, usa tags de cache para limpiar selectivamente
        Cache::flush();
    }
}
