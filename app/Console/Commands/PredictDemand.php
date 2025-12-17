<?php

namespace App\Console\Commands;

use App\Services\AI\PredictionService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PredictDemand extends Command
{
    protected $signature = 'ai:predict-demand {--product= : ID of specific product}';

    protected $description = 'Run AI Linear Regression algorithm to forecast sales for next month';

    public function handle(PredictionService $ai)
    {
        $this->info('🔮 Starting AI Demand Prediction Engine...');

        $query = DB::table('inv_productos')->where('activo', true);

        if ($id = $this->option('product')) {
            $query->where('id', $id);
        }

        $products = $query->get();
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        $results = [];

        foreach ($products as $product) {
            $prediction = $ai->predictNextMonth($product->id);

            if ($prediction['success']) {
                // Guardar en DB
                $this->savePrediction($product->id, $prediction);
                $results[] = [
                    $product->nombre,
                    $prediction['current_trend'],
                    $prediction['next_month_prediction'],
                    $prediction['confidence_score'].'%',
                ];
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if (count($results) > 0) {
            $this->info('✅ Predictions generated successfully:');
            $this->table(
                ['Product', 'Trend', 'Next Month Forecast', 'Confidence'],
                $results
            );
        } else {
            $this->warn('⚠️ No predictions generated. Products might need more sales history (min 2 months).');
        }

        return Command::SUCCESS;
    }

    private function savePrediction($productId, $data)
    {
        // El "Next Month" es el mes siguiente al actual
        $targetDate = Carbon::now()->addMonth()->startOfMonth();

        DB::table('inv_predicciones')->updateOrInsert(
            [
                'producto_id' => $productId,
                'fecha_objetivo' => $targetDate->format('Y-m-d'),
            ],
            [
                'cantidad_predicha' => $data['next_month_prediction'],
                'confianza_score' => $data['confidence_score'],
                'algoritmo' => 'LinearRegression_v1',
                'datos_input' => json_encode(['history_points' => $data['history_points'], 'slope' => $data['slope']]),
                'updated_at' => now(),
            ]
        );
    }
}
