<?php

namespace App\Infrastructure\Persistence\Reports;

use App\Application\Reports\DTOs\ReporteVentasDTO;
use App\Domain\Reports\Repositories\ReporteRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SqlReporteRepository implements ReporteRepositoryInterface
{
    public function getVentasDiarias(Carbon $fechaInicio, Carbon $fechaFin): array
    {
        // Optimized Raw Query or Builder
        // We aggregate by Date

        $results = DB::table('oper_ventas as v')
            ->join('oper_ventas_det as d', 'v.id', '=', 'd.venta_id')
            ->selectRaw('
                DATE(v.fecha_emision) as fecha,
                COUNT(DISTINCT v.id) as cantidad_transacciones,
                SUM(d.subtotal) + SUM(d.impuesto_aplicado) as total_ventas, -- Assuming details sum match header
                SUM(d.impuesto_aplicado) as total_impuestos,
                SUM(d.costo_unitario_historico * d.cantidad) as total_costo
            ')
            ->whereBetween('v.fecha_emision', [$fechaInicio->startOfDay(), $fechaFin->endOfDay()])
            ->where('v.estado', 'COMPLETADO') // Only completed sales
            ->groupByRaw('DATE(v.fecha_emision)')
            ->orderByRaw('DATE(v.fecha_emision) ASC')
            ->get();

        return $results->map(function ($row) {
            $totalVentas = (float) $row->total_ventas;
            $totalCosto = (float) $row->total_costo;
            $margenBruto = $totalVentas - $totalCosto;
            $margenPorcentaje = $totalVentas > 0 ? ($margenBruto / $totalVentas) * 100 : 0;

            return new ReporteVentasDTO(
                fecha: $row->fecha,
                cantidad_transacciones: (int) $row->cantidad_transacciones,
                total_ventas: $totalVentas,
                total_impuestos: (float) $row->total_impuestos,
                total_costo: $totalCosto,
                margen_bruto: $margenBruto,
                margen_porcentaje: $margenPorcentaje
            );
        })->toArray();
    }
}
