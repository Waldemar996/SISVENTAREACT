<?php

namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\Venta;

interface VentaRepositoryInterface
{
    public function save(Venta $venta): Venta;

    public function findById(int $id): ?Venta;
}
