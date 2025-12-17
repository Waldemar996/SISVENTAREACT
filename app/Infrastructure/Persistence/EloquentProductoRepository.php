<?php

namespace App\Infrastructure\Persistence;

use App\Domain\Inventory\Entities\Producto;
use App\Domain\Inventory\Repositories\ProductoRepositoryInterface;
use App\Domain\Sales\ValueObjects\Dinero;
use App\Models\Inventario\InvProducto;

class EloquentProductoRepository implements ProductoRepositoryInterface
{
    public function save(Producto $producto): Producto
    {
        // Mapping Logic
        $data = [
            'codigo_sku' => $producto->getSku(),
            'nombre' => $producto->getNombre(),
            'precio_venta_base' => $producto->getPrecioBase()->getMonto(),
            'impuesto_porcentaje' => $producto->getPorcentajeImpuesto(),
            'controla_stock' => $producto->controlsStock(),
            'activo' => $producto->isActivo(),
        ];

        if ($producto->getId()) {
            $model = InvProducto::find($producto->getId());
            $model->update($data);
        } else {
            $model = InvProducto::create($data);
            $producto->setId($model->id);
        }

        return $producto;
    }

    public function findById(int $id): ?Producto
    {
        $model = InvProducto::find($id);
        if (! $model) {
            return null;
        }

        return $this->toEntity($model);
    }

    public function findBySku(string $sku): ?Producto
    {
        $model = InvProducto::where('codigo_sku', $sku)->first();
        if (! $model) {
            return null;
        }

        return $this->toEntity($model);
    }

    private function toEntity(InvProducto $model): Producto
    {
        $prod = new Producto(
            $model->codigo_sku,
            $model->nombre,
            new Dinero($model->precio_venta_base),
            (float) $model->impuesto_porcentaje,
            $model->controla_stock,
            $model->activo
        );
        $prod->setId($model->id);
        $prod->setCostoPromedio(new Dinero($model->costo_promedio ?? 0));

        return $prod;
    }
}
