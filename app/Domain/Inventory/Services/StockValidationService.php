<?php

namespace App\Domain\Inventory\Services;

use App\Domain\Inventory\Repositories\KardexRepositoryInterface;
use Exception;

class StockValidationService
{
    private KardexRepositoryInterface $repository;

    private \App\Domain\Inventory\Repositories\ProductoRepositoryInterface $productoRepository;

    public function __construct(
        KardexRepositoryInterface $repository,
        \App\Domain\Inventory\Repositories\ProductoRepositoryInterface $productoRepository
    ) {
        $this->repository = $repository;
        $this->productoRepository = $productoRepository;
    }

    public function checkAvailability(int $bodegaId, int $productoId, float $cantidadRequerida): void
    {
        // 1. Check if product controls stock
        $producto = $this->productoRepository->findById($productoId);

        if (! $producto || ! $producto->controlsStock()) {
            return;
        }

        // 2. Validate Stock
        $currentStock = $this->repository->getStock($bodegaId, $productoId);

        if ($currentStock < $cantidadRequerida) {
            throw new Exception("Stock insuficiente. Disponible: {$currentStock}, Requerido: {$cantidadRequerida}");
        }
    }
}
