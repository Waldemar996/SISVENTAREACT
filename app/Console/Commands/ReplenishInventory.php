<?php

namespace App\Console\Commands;

use App\Services\AI\ReplenishmentService;
use Illuminate\Console\Command;

class ReplenishInventory extends Command
{
    protected $signature = 'ai:replenish';

    protected $description = 'Analyze predictions and current stock to generate purchase proposals';

    public function handle(ReplenishmentService $service)
    {
        $this->info('📦 Starting Smart Replenishment Analysis...');

        $proposals = $service->generateProposals();

        $this->newLine();

        if (count($proposals) > 0) {
            $this->info('✅ Generated '.count($proposals).' purchase proposals:');

            $headers = ['Product', 'Qty Needed', 'Priority', 'Confidence', 'Reason'];
            $data = [];

            foreach ($proposals as $p) {
                $data[] = [
                    $p['product'],
                    $p['qty'],
                    $p['priority'],
                    $p['confidence'].'%',
                    $p['reason'],
                ];
            }

            $this->table($headers, $data);
            $this->newLine();
            $this->components->info('Run "php artisan ai:review-orders" to approve/reject these proposals.');
        } else {
            $this->info('✨ Inventory is healthy. No replenishment needed based on current predictions.');
        }

        return Command::SUCCESS;
    }
}
