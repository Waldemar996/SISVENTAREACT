<?php

namespace App\Console\Commands;

use App\CQRS\Projectors\VentaProjector;
use Illuminate\Console\Command;

/**
 * Reconstruye el Read Model desde Event Store
 *
 * Útil para:
 * - Migración inicial
 * - Recuperación de desastres
 * - Cambios en schema del read model
 *
 * Usage: php artisan cqrs:rebuild-read-model
 */
class RebuildReadModel extends Command
{
    protected $signature = 'cqrs:rebuild-read-model 
                            {--force : Force rebuild without confirmation}';

    protected $description = 'Rebuilds the read model from event store';

    public function handle(VentaProjector $projector): int
    {
        if (! $this->option('force')) {
            if (! $this->confirm('This will delete and rebuild the entire read model. Continue?')) {
                $this->info('Operation cancelled.');

                return Command::SUCCESS;
            }
        }

        $this->info('Starting read model rebuild...');

        $startTime = microtime(true);

        try {
            // Rebuild
            $projector->rebuild();

            $duration = round((microtime(true) - $startTime), 2);

            $this->info("✅ Read model rebuilt successfully in {$duration} seconds!");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error rebuilding read model: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
