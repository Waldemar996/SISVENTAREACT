<?php

namespace App\DTOs\Ventas;

/**
 * DTO para crear una nueva venta
 * 
 * Ventajas de usar DTOs:
 * - Type safety
 * - Validación centralizada
 * - Inmutabilidad
 * - Fácil de testear
 * - Desacopla request de lógica de negocio
 */
class CrearVentaDTO
{
    public function __construct(
        public readonly int $clienteId,
        public readonly ?int $bodegaId,
        public readonly string $tipoComprobante,
        public readonly ?string $numeroComprobante,
        public readonly ?string $serieComprobante,
        public readonly string $formaPago,
        public readonly array $detalles,
        public readonly ?string $observaciones = null,
        public readonly ?int $sesionCajaId = null,
        public readonly ?int $usuarioId = null,
        public readonly ?float $descuentoGlobal = 0,
        public readonly ?float $impuestoTotal = 0
    ) {
        $this->validate();
    }

    /**
     * Crea un DTO desde un array (típicamente desde Request)
     */
    public static function fromArray(array $data): self
    {
        return new self(
            clienteId: $data['cliente_id'],
            bodegaId: $data['bodega_id'] ?? null,
            tipoComprobante: $data['tipo_comprobante'],
            numeroComprobante: $data['numero_comprobante'] ?? null,
            serieComprobante: $data['serie_comprobante'] ?? null,
            formaPago: $data['forma_pago'] ?? 'EFECTIVO',
            detalles: $data['detalles'],
            observaciones: $data['observaciones'] ?? null,
            sesionCajaId: $data['sesion_caja_id'] ?? null,
            usuarioId: $data['usuario_id'] ?? auth()->id(),
            descuentoGlobal: $data['descuento_global'] ?? 0,
            impuestoTotal: $data['impuesto_total'] ?? 0
        );
    }

    /**
     * Crea un DTO desde un Request de Laravel
     */
    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return self::fromArray($request->validated());
    }

    /**
     * Validaciones adicionales de negocio
     */
    private function validate(): void
    {
        if (empty($this->detalles)) {
            throw new \InvalidArgumentException('La venta debe tener al menos un detalle');
        }

        if ($this->descuentoGlobal < 0 || $this->descuentoGlobal > 100) {
            throw new \InvalidArgumentException('El descuento global debe estar entre 0 y 100');
        }

        foreach ($this->detalles as $index => $detalle) {
            if (!isset($detalle['producto_id']) || !isset($detalle['cantidad']) || !isset($detalle['precio_unitario'])) {
                throw new \InvalidArgumentException("El detalle {$index} está incompleto");
            }

            if ($detalle['cantidad'] <= 0) {
                throw new \InvalidArgumentException("La cantidad del detalle {$index} debe ser mayor a 0");
            }

            if ($detalle['precio_unitario'] < 0) {
                throw new \InvalidArgumentException("El precio del detalle {$index} no puede ser negativo");
            }
        }
    }

    /**
     * Convierte el DTO a array
     */
    public function toArray(): array
    {
        return [
            'cliente_id' => $this->clienteId,
            'bodega_id' => $this->bodegaId,
            'tipo_comprobante' => $this->tipoComprobante,
            'numero_comprobante' => $this->numeroComprobante,
            'serie_comprobante' => $this->serieComprobante,
            'forma_pago' => $this->formaPago,
            'detalles' => $this->detalles,
            'observaciones' => $this->observaciones,
            'sesion_caja_id' => $this->sesionCajaId,
            'usuario_id' => $this->usuarioId,
            'descuento_global' => $this->descuentoGlobal,
            'impuesto_total' => $this->impuestoTotal
        ];
    }

    /**
     * Calcula el total de la venta
     */
    public function calcularTotal(): float
    {
        $subtotal = 0;

        foreach ($this->detalles as $detalle) {
            $cantidad = $detalle['cantidad'];
            $precioUnitario = $detalle['precio_unitario'];
            $descuento = $detalle['descuento'] ?? 0;
            
            $subtotalDetalle = $cantidad * $precioUnitario;
            $descuentoDetalle = $subtotalDetalle * ($descuento / 100);
            
            $subtotal += ($subtotalDetalle - $descuentoDetalle);
        }

        // Aplicar descuento global
        $descuentoGlobalMonto = $subtotal * ($this->descuentoGlobal / 100);
        $subtotal -= $descuentoGlobalMonto;

        // Agregar impuestos
        $total = $subtotal + $this->impuestoTotal;

        return round($total, 2);
    }

    /**
     * Obtiene el número de items en la venta
     */
    public function getCantidadItems(): int
    {
        return count($this->detalles);
    }

    /**
     * Obtiene la cantidad total de productos
     */
    public function getCantidadTotal(): int
    {
        return array_sum(array_column($this->detalles, 'cantidad'));
    }
}
