<?php

namespace App\Domain\Inventory\Repositories;

use App\Domain\Inventory\Entities\Producto;

interface ProductoRepositoryInterface
{
    public function save(Producto $producto): Producto;

    public function findById(int $id): ?Producto;

    public function findBySku(string $sku): ?Producto;
}
