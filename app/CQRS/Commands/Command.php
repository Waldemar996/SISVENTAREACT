<?php

namespace App\CQRS\Commands;

/**
 * Base Command Interface
 * 
 * Todos los commands deben implementar esta interfaz
 */
interface Command
{
    /**
     * Valida que el command sea válido
     */
    public function validate(): bool;

    /**
     * Nombre del command para logging
     */
    public function getName(): string;
}
