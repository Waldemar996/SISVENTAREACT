<?php

namespace App\EventSourcing\Events\Ventas;

use App\EventSourcing\DomainEvent;

/**
 * Evento: Venta Creada
 *
 * Se dispara cuando se crea una nueva venta
 * Contiene TODA la información necesaria para reconstruir el estado
 */
class VentaCreadaEvent extends DomainEvent
{
    public function __construct(
        public readonly int $ventaId,
        public readonly int $clienteId,
        public readonly int $usuarioId,
        public readonly int $bodegaId,
        public readonly string $tipoComprobante,
        public readonly string $numeroComprobante,
        public readonly string $formaPago,
        public readonly float $subtotal,
        public readonly float $descuentoTotal,
        public readonly float $impuestoTotal,
        public readonly float $total,
        public readonly array $detalles,
        public readonly ?string $observaciones = null
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
            'cliente_id' => $this->clienteId,
            'usuario_id' => $this->usuarioId,
            'bodega_id' => $this->bodegaId,
            'tipo_comprobante' => $this->tipoComprobante,
            'numero_comprobante' => $this->numeroComprobante,
            'forma_pago' => $this->formaPago,
            'subtotal' => $this->subtotal,
            'descuento_total' => $this->descuentoTotal,
            'impuesto_total' => $this->impuestoTotal,
            'total' => $this->total,
            'detalles' => $this->detalles,
            'observaciones' => $this->observaciones,
        ];
    }

    public static function fromArray(array $data, array $metadata): self
    {
        $event = new self(
            ventaId: $data['venta_id'],
            clienteId: $data['cliente_id'],
            usuarioId: $data['usuario_id'],
            bodegaId: $data['bodega_id'],
            tipoComprobante: $data['tipo_comprobante'],
            numeroComprobante: $data['numero_comprobante'],
            formaPago: $data['forma_pago'],
            subtotal: $data['subtotal'],
            descuentoTotal: $data['descuento_total'],
            impuestoTotal: $data['impuesto_total'],
            total: $data['total'],
            detalles: $data['detalles'],
            observaciones: $data['observaciones'] ?? null
        );

        $event->metadata = $metadata;

        return $event;
    }
}
