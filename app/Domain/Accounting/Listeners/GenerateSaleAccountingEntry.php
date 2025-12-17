<?php

namespace App\Domain\Accounting\Listeners;

use App\Domain\Accounting\Services\AccountingService;
use App\Domain\Sales\Events\VentaConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateSaleAccountingEntry implements ShouldQueue
{
    private AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    public function handle(VentaConfirmed $event): void
    {
        $this->accountingService->createEntryForSale($event->ventaId);
    }
}
