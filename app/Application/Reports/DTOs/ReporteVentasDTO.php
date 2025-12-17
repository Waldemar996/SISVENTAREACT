<?php

namespace App\Application\Reports\DTOs;

class ReporteVentasDTO
{
    public function __construct(
        public readonly string $fecha,
        public readonly int $cantidad_transacciones,
        public readonly float $total_ventas,
        public readonly float $total_impuestos,
        public readonly float $total_costo,
        public readonly float $margen_bruto,
        public readonly float $margen_porcentaje
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            fecha: $data['fecha'],
            cantidad_transacciones: (int) $data['cantidad_transacciones'],
            total_ventas: (float) $data['total_ventas'],
            total_impuestos: (float) $data['total_impuestos'],
            total_costo: (float) $data['total_costo'],
            margen_bruto: (float) $data['margen_bruto'],
            margen_porcentaje: (float) $data['margen_porcentaje']
        );
    }
}
