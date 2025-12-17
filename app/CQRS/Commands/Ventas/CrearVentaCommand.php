<?php

namespace App\CQRS\Commands\Ventas;

use App\CQRS\Commands\Command;
use App\DTOs\Ventas\CrearVentaDTO;

/**
 * Command: Crear Venta
 *
 * Encapsula la intención de crear una venta
 */
class CrearVentaCommand implements Command
{
    public function __construct(
        public readonly CrearVentaDTO $dto,
        public readonly ?int $requestedBy = null
    ) {}

    public function validate(): bool
    {
        // Validaciones básicas
        return $this->dto->clienteId > 0
            && count($this->dto->detalles) > 0;
    }

    public function getName(): string
    {
        return 'CrearVentaCommand';
    }
}
