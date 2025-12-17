<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Optimiza la base de datos
 *
 * - Optimiza tablas
 * - Analiza tablas
 * - Limpia cache
 * - Regenera estadísticas
 *
 * Usage: php artisan db:optimize
 */
class OptimizeDatabase extends Command
{
    protected $signature = 'db:optimize 
                            {--tables= : Specific tables to optimize (comma-separated)}
                            {--analyze : Run ANALYZE TABLE}
                            {--cache : Clear query cache}';

    protected $description = 'Optimizes database tables and performance';

    public function handle(): int
    {
        $this->info('🔧 Starting database optimization...');

        $tables = $this->option('tables')
            ? explode(',', $this->option('tables'))
            : $this->getAllTables();

        $bar = $this->output->createProgressBar(count($tables));
        $bar->start();

        foreach ($tables as $table) {
            try {
                // Optimize table
                DB::statement("OPTIMIZE TABLE {$table}");

                // Analyze if requested
                if ($this->option('analyze')) {
                    DB::statement("ANALYZE TABLE {$table}");
                }

                $bar->advance();

            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("⚠️  Error optimizing {$table}: ".$e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine(2);

        // Clear cache if requested
        if ($this->option('cache')) {
            $this->info('🧹 Clearing query cache...');
            Cache::flush();
        }

        $this->info('✅ Database optimization completed!');

        // Show statistics
        $this->showStatistics();

        return Command::SUCCESS;
    }

    private function getAllTables(): array
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::getDatabaseName();
        $key = "Tables_in_{$dbName}";

        return array_map(fn ($table) => $table->$key, $tables);
    }

    private function showStatistics(): void
    {
        $stats = DB::select('
            SELECT 
                table_name,
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                table_rows
            FROM information_schema.TABLES
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
            LIMIT 10
        ');

        $this->newLine();
        $this->info('📊 Top 10 largest tables:');
        $this->table(
            ['Table', 'Size (MB)', 'Rows'],
            array_map(fn ($s) => [$s->table_name, $s->size_mb, number_format($s->table_rows)], $stats)
        );
    }
}
