<?php

namespace App\CQRS\CommandBus;

use App\CQRS\Commands\Command;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * Command Bus - Patrón para ejecutar commands
 *
 * Beneficios:
 * - Desacopla controllers de services
 * - Logging centralizado
 * - Middleware support
 * - Retry logic
 */
class CommandBus
{
    private array $handlers = [];

    private array $middleware = [];

    /**
     * Registra un handler para un command
     */
    public function register(string $commandClass, callable $handler): void
    {
        $this->handlers[$commandClass] = $handler;
    }

    /**
     * Agrega middleware
     */
    public function addMiddleware(callable $middleware): void
    {
        $this->middleware[] = $middleware;
    }

    /**
     * Ejecuta un command
     */
    public function execute(Command $command): mixed
    {
        // Validar command
        if (! $command->validate()) {
            throw new Exception("Invalid command: {$command->getName()}");
        }

        // Log inicio
        Log::info("Executing command: {$command->getName()}", [
            'command' => get_class($command),
            'data' => $this->serializeCommand($command),
        ]);

        $startTime = microtime(true);

        try {
            // Ejecutar middleware
            $next = function ($cmd) {
                return $this->executeHandler($cmd);
            };

            foreach (array_reverse($this->middleware) as $middleware) {
                $next = function ($cmd) use ($middleware, $next) {
                    return $middleware($cmd, $next);
                };
            }

            $result = $next($command);

            // Log éxito
            $duration = (microtime(true) - $startTime) * 1000;
            Log::info('Command executed successfully', [
                'command' => $command->getName(),
                'duration_ms' => round($duration, 2),
            ]);

            return $result;

        } catch (Exception $e) {
            // Log error
            Log::error('Command execution failed', [
                'command' => $command->getName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Ejecuta el handler del command
     */
    private function executeHandler(Command $command): mixed
    {
        $commandClass = get_class($command);

        if (! isset($this->handlers[$commandClass])) {
            throw new Exception("No handler registered for: {$commandClass}");
        }

        return call_user_func($this->handlers[$commandClass], $command);
    }

    /**
     * Serializa command para logging
     */
    private function serializeCommand(Command $command): array
    {
        // Implementación básica
        return [
            'class' => get_class($command),
            'name' => $command->getName(),
        ];
    }
}
