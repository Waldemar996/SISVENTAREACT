<?php

namespace App\Application\Sales;

class CreateVentaDTO
{
    public int $clienteId;

    public string $metodoPago;

    public array $items; // Array of ['productoId', 'cantidad', 'precio']

    public int $bodegaId;

    public int $sesionCajaId;

    public function __construct(array $data)
    {
        $this->clienteId = $data['cliente_id'];
        $this->metodoPago = $data['metodo_pago'];
        $this->items = $data['detalles'];
        $this->bodegaId = $data['bodega_id'] ?? 1;
        $this->sesionCajaId = $data['sesion_caja_id'] ?? 1; // Default or require
    }
}
