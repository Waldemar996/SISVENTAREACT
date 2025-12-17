<?php

namespace App\Domain\Sales\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VentaConfirmed
{
    use Dispatchable, SerializesModels;

    public int $ventaId;

    public float $total;

    public int $bodegaId;

    public function __construct(int $ventaId, float $total, int $bodegaId)
    {
        $this->ventaId = $ventaId;
        $this->total = $total;
        $this->bodegaId = $bodegaId;
    }
}
