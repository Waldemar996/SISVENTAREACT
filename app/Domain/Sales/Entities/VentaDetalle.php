<?php

namespace App\Domain\Sales\Entities;

use App\Domain\Sales\ValueObjects\Dinero;
use InvalidArgumentException;

class VentaDetalle
{
    private int $productoId;

    private float $cantidad;

    private Dinero $precioUnitario;

    private Dinero $subtotal;

    public function __construct(int $productoId, float $cantidad, Dinero $precioUnitario)
    {
        if ($cantidad <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a cero.');
        }
        if ($precioUnitario->getMonto() < 0) {
            throw new InvalidArgumentException('El precio unitario no puede ser negativo.');
        }

        $this->productoId = $productoId;
        $this->cantidad = $cantidad;
        $this->precioUnitario = $precioUnitario;
        $this->calcularSubtotal();
    }

    private function calcularSubtotal(): void
    {
        // Simple multiplication for now. Rounding logic should be in Dinero VO.
        $monto = $this->cantidad * $this->precioUnitario->getMonto();
        $this->subtotal = new Dinero($monto);
    }

    public function getSubtotal(): Dinero
    {
        return $this->subtotal;
    }

    public function getProductoId(): int
    {
        return $this->productoId;
    }

    public function getCantidad(): float
    {
        return $this->cantidad;
    }

    public function getPrecioUnitario(): Dinero
    {
        return $this->precioUnitario;
    }
}
