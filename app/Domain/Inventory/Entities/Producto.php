<?php

namespace App\Domain\Inventory\Entities;

use App\Domain\Sales\ValueObjects\Dinero;

class Producto
{
    private ?int $id;

    private string $sku;

    private string $nombre;

    private bool $controlaStock;

    private bool $activo;

    private Dinero $precioBase;

    private float $porcentajeImpuesto;

    private Dinero $costoPromedio;

    public function __construct(
        string $sku,
        string $nombre,
        Dinero $precioBase,
        float $porcentajeImpuesto,
        bool $controlaStock = true,
        bool $activo = true
    ) {
        $this->sku = $sku;
        $this->nombre = $nombre;
        $this->precioBase = $precioBase;
        $this->porcentajeImpuesto = $porcentajeImpuesto;
        $this->controlaStock = $controlaStock;
        $this->activo = $activo;
        $this->costoPromedio = new Dinero(0);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getSku(): string
    {
        return $this->sku;
    }

    public function getNombre(): string
    {
        return $this->nombre;
    }

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function controlsStock(): bool
    {
        return $this->controlaStock;
    }

    public function getPrecioBase(): Dinero
    {
        return $this->precioBase;
    }

    public function getPorcentajeImpuesto(): float
    {
        return $this->porcentajeImpuesto;
    }

    public function getPrecioVentaFinal(): Dinero
    {
        // Precio Base * (1 + (Porcentaje / 100))
        $factor = 1 + ($this->porcentajeImpuesto / 100);

        return new Dinero($this->precioBase->getMonto() * $factor);
    }

    public function setCostoPromedio(Dinero $costo): void
    {
        $this->costoPromedio = $costo;
    }

    public function getCostoPromedio(): Dinero
    {
        return $this->costoPromedio;
    }
}
