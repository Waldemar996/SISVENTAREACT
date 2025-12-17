<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\DB;

/**
 * AI Prediction Engine
 *
 * Implementación nativa de Regresión Lineal Simple (Least Squares)
 * para predecir tendencias de ventas.
 *
 * y = mx + b
 *
 * m = Pendiente (Trend)
 * b = Intersección (Baseline)
 * x = Tiempo
 */
class PredictionService
{
    /**
     * Predice la demanda para el próximo mes de un producto
     */
    public function predictNextMonth(int $productoId): array
    {
        // 1. Obtener historial de ventas agrupado por mes (últimos 12 meses)
        $history = DB::table('oper_ventas_det as d')
            ->join('oper_ventas as v', 'd.venta_id', '=', 'v.id')
            ->selectRaw('
                YEAR(v.fecha_emision) as year,
                MONTH(v.fecha_emision) as month,
                SUM(d.cantidad) as total_qty
            ')
            ->where('d.producto_id', $productoId)
            ->where('v.estado', '!=', 'ANULADO')
            ->where('v.fecha_emision', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        if ($history->count() < 2) {
            return [
                'success' => false,
                'reason' => 'Insuficientes datos (min 2 meses requeridos)',
            ];
        }

        // 2. Preparar datos para regresión (X = índice de mes, Y = cantidad)
        $points = [];
        $i = 1;
        foreach ($history as $record) {
            $points[] = ['x' => $i, 'y' => (float) $record->total_qty];
            $i++;
        }

        // 3. Calcular Regresión Lineal (Least Squares)
        $regression = $this->calculateLinearRegression($points);

        // 4. Predecir el siguiente mes (X = n + 1)
        $nextMonthIndex = count($points) + 1;
        $prediction = ($regression['slope'] * $nextMonthIndex) + $regression['intercept'];

        // Ajuste: No podemos predecir ventas negativas
        $prediction = max(0, $prediction);

        // 5. Calcular score de confianza (R-squared simplificado)
        $confidence = $this->calculateConfidence($points, $regression);

        return [
            'success' => true,
            'producto_id' => $productoId,
            'current_trend' => $regression['slope'] > 0 ? 'UP' : 'DOWN',
            'slope' => round($regression['slope'], 4),
            'next_month_prediction' => round($prediction, 2),
            'confidence_score' => round($confidence * 100, 2),
            'history_points' => count($points),
        ];
    }

    /**
     * Algoritmo de Regresión Lineal (Mínimos Cuadrados)
     */
    private function calculateLinearRegression(array $points): array
    {
        $n = count($points);
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumXX = 0;

        foreach ($points as $p) {
            $sumX += $p['x'];
            $sumY += $p['y'];
            $sumXY += ($p['x'] * $p['y']);
            $sumXX += ($p['x'] * $p['x']);
        }

        // Pendiente (m)
        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX);

        // Intersección (b)
        $intercept = ($sumY - $slope * $sumX) / $n;

        return ['slope' => $slope, 'intercept' => $intercept];
    }

    /**
     * Calcula una métrica de confianza simple
     * Basado en qué tan lejos están los puntos reales de la línea predicha
     */
    private function calculateConfidence(array $points, array $regression): float
    {
        $errorSum = 0;
        $totalY = 0;

        foreach ($points as $p) {
            $predictedY = ($regression['slope'] * $p['x']) + $regression['intercept'];
            $diff = abs($p['y'] - $predictedY);
            $errorSum += $diff;
            $totalY += $p['y'];
        }

        if ($totalY == 0) {
            return 0;
        }

        $avgError = $errorSum / count($points);
        $avgY = $totalY / count($points);

        // Si el error promedio es pequeño comparado con el promedio de ventas, confiamos más
        // Relación inversa: Menor error relativo = Mayor confianza
        $relativeError = $avgError / ($avgY ?: 1);

        // Simple heuristic: 1 - error relativo (clamped 0 to 1)
        return max(0, min(1, 1 - $relativeError));
    }
}
