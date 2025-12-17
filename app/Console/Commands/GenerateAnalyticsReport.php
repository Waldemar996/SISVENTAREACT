<?php

namespace App\Console\Commands;

use App\Services\Analytics\AdvancedAnalyticsService;
use Illuminate\Console\Command;

/**
 * Genera reporte de analytics
 *
 * Usage: php artisan analytics:report {type}
 */
class GenerateAnalyticsReport extends Command
{
    protected $signature = 'analytics:report 
                            {type : Type of report (rfm|cohort|abc|all)}
                            {--export= : Export to file (json|csv)}';

    protected $description = 'Generates analytics reports';

    public function handle(AdvancedAnalyticsService $analytics): int
    {
        $type = $this->argument('type');

        $this->info("Generating {$type} analytics report...");

        try {
            $data = match ($type) {
                'rfm' => $analytics->getRFMSegmentation(),
                'cohort' => $analytics->getCohortAnalysis(),
                'abc' => $analytics->getABCAnalysis(),
                'all' => [
                    'rfm' => $analytics->getRFMSegmentation(),
                    'cohort' => $analytics->getCohortAnalysis(),
                    'abc' => $analytics->getABCAnalysis(),
                ],
                default => throw new \Exception("Unknown report type: {$type}")
            };

            // Export if requested
            if ($exportFormat = $this->option('export')) {
                $filename = $this->exportReport($data, $type, $exportFormat);
                $this->info("✅ Report exported to: {$filename}");
            } else {
                // Display in console
                $this->displayReport($data, $type);
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error generating report: '.$e->getMessage());

            return Command::FAILURE;
        }
    }

    private function displayReport(array $data, string $type): void
    {
        if ($type === 'rfm') {
            $this->table(
                ['Cliente', 'RFM Score', 'Segment', 'Value'],
                array_map(fn ($row) => [
                    $row['nombre'],
                    $row['rfm_score'],
                    $row['segment'],
                    $row['value'],
                ], array_slice($data, 0, 10))
            );
        } elseif ($type === 'abc') {
            $this->table(
                ['Producto', 'Revenue', 'Category'],
                array_map(fn ($row) => [
                    $row['nombre'],
                    '$'.number_format($row['total_revenue'], 2),
                    $row['category'],
                ], array_slice($data, 0, 10))
            );
        }
    }

    private function exportReport(array $data, string $type, string $format): string
    {
        $filename = storage_path("app/reports/{$type}_".date('Y-m-d_His').".{$format}");

        if ($format === 'json') {
            file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
        } elseif ($format === 'csv') {
            $fp = fopen($filename, 'w');
            if (! empty($data)) {
                fputcsv($fp, array_keys($data[0]));
                foreach ($data as $row) {
                    fputcsv($fp, $row);
                }
            }
            fclose($fp);
        }

        return $filename;
    }
}
