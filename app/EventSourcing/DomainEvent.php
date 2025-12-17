<?php

namespace App\EventSourcing;

use Carbon\Carbon;

/**
 * Base class para todos los Domain Events
 *
 * Un Domain Event representa algo que YA PASÓ en el dominio
 * Siempre en pasado: VentaCreada, ProductoActualizado, StockReducido
 */
abstract class DomainEvent
{
    protected Carbon $occurredAt;

    protected ?int $userId;

    protected array $metadata;

    public function __construct()
    {
        $this->occurredAt = now();
        $this->userId = auth()->id();
        $this->metadata = [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ];
    }

    /**
     * Tipo de agregado (venta, compra, producto, etc.)
     */
    abstract public function aggregateType(): string;

    /**
     * ID del agregado específico
     */
    abstract public function aggregateId(): string;

    /**
     * Convierte el evento a array para serialización
     */
    abstract public function toArray(): array;

    /**
     * Reconstruye el evento desde un array
     */
    abstract public static function fromArray(array $data, array $metadata): self;

    /**
     * Getters
     */
    public function occurredAt(): Carbon
    {
        return $this->occurredAt;
    }

    public function userId(): ?int
    {
        return $this->userId;
    }

    public function metadata(): array
    {
        return $this->metadata;
    }

    /**
     * Nombre del evento (para logging)
     */
    public function eventName(): string
    {
        return class_basename($this);
    }
}
