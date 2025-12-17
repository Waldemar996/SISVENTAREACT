<?php

namespace App\EventSourcing\Events\Ventas;

use App\EventSourcing\DomainEvent;

/**
 * Evento: Venta Anulada
 */
class VentaAnuladaEvent extends DomainEvent
{
    public function __construct(
        public readonly int $ventaId,
        public readonly string $numeroComprobante,
        public readonly ?string $motivo = null,
        public readonly ?int $anuladoPorUsuarioId = null
    ) {
        parent::__construct();
    }

    public function aggregateType(): string
    {
        return 'venta';
    }

    public function aggregateId(): string
    {
        return (string) $this->ventaId;
    }

    public function toArray(): array
    {
        return [
            'venta_id' => $this->ventaId,
            'numero_comprobante' => $this->numeroComprobante,
            'motivo' => $this->motivo,
            'anulado_por_usuario_id' => $this->anuladoPorUsuarioId,
        ];
    }

    public static function fromArray(array $data, array $metadata): self
    {
        $event = new self(
            ventaId: $data['venta_id'],
            numeroComprobante: $data['numero_comprobante'],
            motivo: $data['motivo'] ?? null,
            anuladoPorUsuarioId: $data['anulado_por_usuario_id'] ?? null
        );

        $event->metadata = $metadata;

        return $event;
    }
}
