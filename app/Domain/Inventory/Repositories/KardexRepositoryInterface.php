<?php

namespace App\Domain\Inventory\Repositories;

interface KardexRepositoryInterface
{
    public function getStock(int $bodegaId, int $productoId): float;

    public function registerMovement(int $bodegaId, int $productoId, string $tipo, float $cantidad, float $costo, string $referencia = '', ?int $referenciaId = null): void;
}
