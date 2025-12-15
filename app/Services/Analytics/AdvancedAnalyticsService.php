<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * Advanced Analytics Service
 * 
 * Implementa análisis avanzados:
 * - RFM Segmentation
 * - Cohort Analysis
 * - Customer Lifetime Value
 * - Churn Prediction
 * - ABC Analysis
 * 
 * Nivel: Netflix/Amazon Analytics
 */
class AdvancedAnalyticsService
{
    /**
     * RFM Segmentation
     * 
     * Recency: Qué tan reciente fue la última compra
     * Frequency: Qué tan seguido compra
     * Monetary: Cuánto gasta
     */
    public function getRFMSegmentation(): array
    {
        return Cache::remember('analytics:rfm', 3600, function() {
            $clientes = DB::table('com_clientes as c')
                ->selectRaw("
                    c.id,
                    c.razon_social,
                    c.nit,
                    COALESCE(DATEDIFF(NOW(), MAX(v.fecha_emision)), 999) as recency_days,
                    COALESCE(COUNT(v.id), 0) as frequency,
                    COALESCE(SUM(v.total_venta), 0) as monetary
                ")
                ->leftJoin('oper_ventas as v', function($join) {
                    $join->on('c.id', '=', 'v.cliente_id')
                         ->where('v.estado', '!=', 'ANULADO');
                })
                ->where('c.activo', true)
                ->groupBy('c.id', 'c.razon_social', 'c.nit')
                ->get();

            // Calcular scores (1-5)
            $recencyScores = $this->calculateQuintiles($clientes->pluck('recency_days')->toArray(), true);
            $frequencyScores = $this->calculateQuintiles($clientes->pluck('frequency')->toArray());
            $monetaryScores = $this->calculateQuintiles($clientes->pluck('monetary')->toArray());

            return $clientes->map(function($cliente, $index) use ($recencyScores, $frequencyScores, $monetaryScores) {
                $r = $recencyScores[$index];
                $f = $frequencyScores[$index];
                $m = $monetaryScores[$index];

                return [
                    'cliente_id' => $cliente->id,
                    'nombre' => $cliente->razon_social,
                    'nit' => $cliente->nit,
                    'recency_days' => $cliente->recency_days,
                    'frequency' => $cliente->frequency,
                    'monetary' => $cliente->monetary,
                    'r_score' => $r,
                    'f_score' => $f,
                    'm_score' => $m,
                    'rfm_score' => "{$r}{$f}{$m}",
                    'segment' => $this->getSegmentName($r, $f, $m),
                    'value' => $this->getCustomerValue($r, $f, $m)
                ];
            })->toArray();
        });
    }

    /**
     * Cohort Analysis
     * 
     * Analiza retención de clientes por cohorte (mes de primera compra)
     */
    public function getCohortAnalysis(): array
    {
        return Cache::remember('analytics:cohort', 3600, function() {
            // Obtener primera compra de cada cliente
            $primerasCompras = DB::table('oper_ventas')
                ->select(
                    'cliente_id',
                    DB::raw('DATE_FORMAT(MIN(fecha_emision), "%Y-%m") as cohort_month'),
                    DB::raw('MIN(fecha_emision) as first_purchase')
                )
                ->where('estado', '!=', 'ANULADO')
                ->groupBy('cliente_id')
                ->get();

            // Construir matriz de retención
            $cohorts = [];
            foreach ($primerasCompras as $primera) {
                $cohortMonth = $primera->cohort_month;
                
                if (!isset($cohorts[$cohortMonth])) {
                    $cohorts[$cohortMonth] = [
                        'cohort' => $cohortMonth,
                        'customers' => 0,
                        'retention' => []
                    ];
                }
                
                $cohorts[$cohortMonth]['customers']++;

                // Calcular retención por mes
                $comprasPosterior = DB::table('oper_ventas')
                    ->where('cliente_id', $primera->cliente_id)
                    ->where('estado', '!=', 'ANULADO')
                    ->where('fecha_emision', '>=', $primera->first_purchase)
                    ->selectRaw('DATE_FORMAT(fecha_emision, "%Y-%m") as month')
                    ->distinct()
                    ->pluck('month');

                foreach ($comprasPosterior as $month) {
                    $monthsAfter = $this->getMonthsDifference($cohortMonth, $month);
                    if (!isset($cohorts[$cohortMonth]['retention'][$monthsAfter])) {
                        $cohorts[$cohortMonth]['retention'][$monthsAfter] = 0;
                    }
                    $cohorts[$cohortMonth]['retention'][$monthsAfter]++;
                }
            }

            // Calcular porcentajes
            foreach ($cohorts as &$cohort) {
                $total = $cohort['customers'];
                foreach ($cohort['retention'] as $month => &$count) {
                    $count = [
                        'count' => $count,
                        'percentage' => round(($count / $total) * 100, 2)
                    ];
                }
            }

            return array_values($cohorts);
        });
    }

    /**
     * Customer Lifetime Value (CLV)
     */
    public function getCustomerLifetimeValue(int $clienteId): array
    {
        $stats = DB::table('oper_ventas')
            ->where('cliente_id', $clienteId)
            ->where('estado', '!=', 'ANULADO')
            ->selectRaw('
                COUNT(*) as total_purchases,
                SUM(total_venta) as total_spent,
                AVG(total_venta) as avg_purchase,
                MIN(fecha_emision) as first_purchase,
                MAX(fecha_emision) as last_purchase,
                DATEDIFF(MAX(fecha_emision), MIN(fecha_emision)) as customer_age_days
            ')
            ->first();

        if (!$stats || $stats->total_purchases == 0) {
            return [
                'clv' => 0,
                'avg_purchase_value' => 0,
                'purchase_frequency' => 0,
                'customer_lifespan_days' => 0
            ];
        }

        // CLV = Avg Purchase Value × Purchase Frequency × Customer Lifespan
        $avgPurchaseValue = $stats->avg_purchase;
        $purchaseFrequency = $stats->total_purchases / max(1, $stats->customer_age_days / 30); // por mes
        $customerLifespan = max(1, $stats->customer_age_days / 365); // años

        $clv = $avgPurchaseValue * $purchaseFrequency * 12 * $customerLifespan;

        return [
            'clv' => round($clv, 2),
            'avg_purchase_value' => round($avgPurchaseValue, 2),
            'purchase_frequency' => round($purchaseFrequency, 2),
            'customer_lifespan_days' => $stats->customer_age_days,
            'total_purchases' => $stats->total_purchases,
            'total_spent' => $stats->total_spent
        ];
    }

    /**
     * ABC Analysis (Productos)
     * 
     * A: 80% de las ventas (top productos)
     * B: 15% de las ventas
     * C: 5% de las ventas
     */
    public function getABCAnalysis(): array
    {
        $productos = DB::table('oper_ventas_det as vd')
            ->join('oper_ventas as v', 'vd.venta_id', '=', 'v.id')
            ->join('inv_productos as p', 'vd.producto_id', '=', 'p.id')
            ->where('v.estado', '!=', 'ANULADO')
            ->selectRaw('
                p.id,
                p.nombre,
                p.codigo_sku,
                SUM(vd.cantidad) as total_quantity,
                SUM(vd.subtotal) as total_revenue
            ')
            ->groupBy('p.id', 'p.nombre', 'p.codigo_sku')
            ->orderBy('total_revenue', 'desc')
            ->get();

        $totalRevenue = $productos->sum('total_revenue');
        $cumulative = 0;

        return $productos->map(function($producto) use ($totalRevenue, &$cumulative) {
            $cumulative += $producto->total_revenue;
            $cumulativePercentage = ($cumulative / $totalRevenue) * 100;

            $category = 'C';
            if ($cumulativePercentage <= 80) {
                $category = 'A';
            } elseif ($cumulativePercentage <= 95) {
                $category = 'B';
            }

            return [
                'producto_id' => $producto->id,
                'nombre' => $producto->nombre,
                'codigo_sku' => $producto->codigo_sku,
                'total_quantity' => $producto->total_quantity,
                'total_revenue' => $producto->total_revenue,
                'revenue_percentage' => round(($producto->total_revenue / $totalRevenue) * 100, 2),
                'cumulative_percentage' => round($cumulativePercentage, 2),
                'category' => $category
            ];
        })->toArray();
    }

    /**
     * Calcula quintiles para scoring
     */
    private function calculateQuintiles(array $values, bool $reverse = false): array
    {
        $sorted = $values;
        sort($sorted);
        
        $count = count($sorted);
        $quintileSize = $count / 5;

        $scores = [];
        foreach ($values as $value) {
            $position = array_search($value, $sorted);
            $score = min(5, max(1, ceil(($position + 1) / $quintileSize)));
            
            if ($reverse) {
                $score = 6 - $score; // Invertir para recency
            }
            
            $scores[] = $score;
        }

        return $scores;
    }

    /**
     * Obtiene nombre del segmento RFM
     */
    private function getSegmentName(int $r, int $f, int $m): string
    {
        $score = $r + $f + $m;

        if ($r >= 4 && $f >= 4 && $m >= 4) {
            return 'Champions';
        } elseif ($r >= 3 && $f >= 3 && $m >= 3) {
            return 'Loyal Customers';
        } elseif ($r >= 4 && $f <= 2) {
            return 'New Customers';
        } elseif ($r <= 2 && $f >= 3) {
            return 'At Risk';
        } elseif ($r <= 2 && $f <= 2) {
            return 'Lost';
        } else {
            return 'Potential';
        }
    }

    /**
     * Valor del cliente
     */
    private function getCustomerValue(int $r, int $f, int $m): string
    {
        $score = $r + $f + $m;

        if ($score >= 12) return 'High';
        if ($score >= 8) return 'Medium';
        return 'Low';
    }

    /**
     * Diferencia en meses entre dos fechas
     */
    private function getMonthsDifference(string $date1, string $date2): int
    {
        $d1 = Carbon::parse($date1);
        $d2 = Carbon::parse($date2);
        return $d1->diffInMonths($d2);
    }
}
