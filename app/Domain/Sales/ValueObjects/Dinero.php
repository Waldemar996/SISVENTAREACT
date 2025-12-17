<?php

namespace App\Domain\Sales\ValueObjects;

class Dinero
{
    private float $monto;

    public function __construct(float $monto)
    {
        // En un sistema real usaríamos BCMath o enteros (centavos).
        // Por ahora float con redondeo estricto a 2 decimales.
        $this->monto = round($monto, 2);
    }

    public function getMonto(): float
    {
        return $this->monto;
    }

    public function sumar(Dinero $otro): Dinero
    {
        return new Dinero($this->monto + $otro->getMonto());
    }

    public function restar(Dinero $otro): Dinero
    {
        return new Dinero($this->monto - $otro->getMonto());
    }
}
