<?php

namespace App\Domain\Sales\Entities;

use App\Domain\Sales\ValueObjects\Dinero;
use InvalidArgumentException;

class Venta
{
    private ?int $id;

    private int $clienteId;

    /** @var VentaDetalle[] */
    private array $detalles = [];

    private Dinero $total;

    private string $estado;

    private string $metodoPago;

    private int $bodegaId;

    private int $sesionCajaId;

    public function __construct(int $clienteId, int $bodegaId, int $sesionCajaId, string $metodoPago)
    {
        $this->clienteId = $clienteId;
        $this->bodegaId = $bodegaId;
        $this->sesionCajaId = $sesionCajaId;
        $this->metodoPago = $metodoPago;
        $this->estado = 'BORRADOR';
        $this->total = new Dinero(0);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getBodegaId(): int
    {
        return $this->bodegaId;
    }

    public function getSesionCajaId(): int
    {
        return $this->sesionCajaId;
    }

    public function agregarDetalle(VentaDetalle $detalle): void
    {
        $this->detalles[] = $detalle;
        $this->recalcularTotal();
    }

    private function recalcularTotal(): void
    {
        $nuevoTotal = 0;
        foreach ($this->detalles as $detalle) {
            $nuevoTotal += $detalle->getSubtotal()->getMonto();
        }
        $this->total = new Dinero($nuevoTotal);
    }

    public function confirmar(): void
    {
        if (empty($this->detalles)) {
            throw new InvalidArgumentException('No se puede confirmar una venta sin detalles.');
        }
        if ($this->total->getMonto() <= 0) {
            throw new InvalidArgumentException('El total de la venta no puede ser cero o negativo.');
        }
        $this->estado = 'COMPLETADO';
    }

    // Getters
    public function getDetalles(): array
    {
        return $this->detalles;
    }

    public function getTotal(): Dinero
    {
        return $this->total;
    }

    public function getClienteId(): int
    {
        return $this->clienteId;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function getMetodoPago(): string
    {
        return $this->metodoPago;
    }
}
