<?php

namespace App\Services;

use App\Models\Config\SysAuditoriaLog;

class AuditService implements \App\Domain\Shared\AuditServiceInterface
{
    /**
     * Registra una acción en la bitácora del sistema.
     * En MODO ESTRICTO: Si falla la auditoría, falla la transacción completa.
     */
    public function log(string $modulo, string $accion, string $tabla, $registroId = null, $datosAnteriores = null, $datosNuevos = null): void
    {
        // Static facade forwarder if needed, or direct implementation.
        // The interface defines instance method, but legacy code uses static.
        // We will keep static for legacy but implement instance method for interface.
        self::staticLog($modulo, $accion, $tabla, $registroId, $datosAnteriores, $datosNuevos);
    }

    public static function staticLog($modulo, $accion, $tabla, $registro_id = null, $datos_anteriores = null, $datos_nuevos = null)
    {
        // STRICT MODE: No Try-Catch. Let DB exceptions bubble up to TransactionMiddleware.

        SysAuditoriaLog::create([
            'usuario_id' => auth()->id() ?? null,
            'modulo' => strtoupper($modulo),
            'accion' => strtoupper($accion),
            'tabla_afectada' => strtolower($tabla),
            'registro_id' => $registro_id,
            'datos_anteriores' => $datos_anteriores,
            'datos_nuevos' => $datos_nuevos,
            'ip_usuario' => request()->ip(),
            'navegador_info' => substr(request()->userAgent(), 0, 250),
            'fecha' => now(),
        ]);

        // If SysAuditoriaLog::create fails, Exception is thrown -> Rollback occurs.
    }
}
