<?php

namespace App\Console\Commands;

use App\Services\AI\ReplenishmentService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReviewOrders extends Command
{
    protected $signature = 'ai:review-orders';

    protected $description = 'Interactively review and approve AI-generated purchase proposals';

    public function handle(ReplenishmentService $service)
    {
        $this->info('🕵️  Starting Purchase Proposal Review...');

        $pending = DB::table('com_propuestas_compra')
            ->join('inv_productos', 'com_propuestas_compra.producto_id', '=', 'inv_productos.id')
            ->where('com_propuestas_compra.estado', 'pendiente')
            ->select(
                'com_propuestas_compra.*',
                'inv_productos.nombre as producto_nombre',
                'inv_productos.stock_minimo'
            )
            ->orderByRaw("FIELD(prioridad, 'CRITICA', 'ALTA', 'NORMAL')")
            ->get();

        if ($pending->isEmpty()) {
            $this->info('✨ No pending proposals to review.');

            return Command::SUCCESS;
        }

        $this->info('Found '.$pending->count().' pending proposals.');
        $this->newLine();

        $adminUser = DB::table('sys_usuarios')->where('username', 'admin')->first();
        $userId = $adminUser ? $adminUser->id : 1;

        foreach ($pending as $p) {
            $this->components->info("Product: {$p->producto_nombre}");

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Priority', $p->prioridad],
                    ['Suggested Qty', $p->cantidad_sugerida],
                    ['Current Stock', $p->stock_actual],
                    ['Predicted Demand', $p->prediccion_demanda],
                    ['AI Confidence', $p->confianza_ia.'%'],
                    ['Reason', $p->razon_ia],
                ]
            );

            // Alerta si la confianza es baja
            if ($p->confianza_ia < 70) {
                $this->warn('⚠️  WARNING: AI Confidence is low (< 70%). Please review carefully.');
            }

            $choice = $this->choice(
                'Action?',
                ['Approve', 'Reject', 'Skip'],
                0
            );

            if ($choice === 'Approve') {
                $orderId = $service->approveProposal($p->id, $userId);
                if ($orderId) {
                    $this->info("✅ Approved! Purchase Order #{$orderId} created.");
                } else {
                    $this->error('❌ Error creating order.');
                }
            } elseif ($choice === 'Reject') {
                $service->rejectProposal($p->id);
                $this->info('🚫 Proposal rejected.');
            } else {
                $this->line('Skipped.');
            }

            $this->newLine();
        }

        $this->info('Review session completed.');

        return Command::SUCCESS;
    }
}
