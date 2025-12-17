<?php

namespace App\Domain\Shared;

interface AuditServiceInterface
{
    public function log(string $modulo, string $accion, string $tabla, $registroId = null, $datosAnteriores = null, $datosNuevos = null): void;
}
