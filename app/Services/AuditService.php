<?php

namespace App\Services;

use App\Models\Config\SysAuditoriaLog;

class AuditService
{
    /**
     * Registra una acción en la bitácora del sistema.
     *
     * @param string $modulo (Ej: INVENTARIO, VENTAS, SEGURIDAD)
     * @param string $accion (Ej: CREAR, EDITAR, ELIMINAR, LOGIN)
     * @param string $tabla (Ej: inv_productos)
     * @param int|string|null $registro_id ID del registro afectado
     * @param array|null $datos_anteriores Snapshot antes del cambio
     * @param array|null $datos_nuevos Snapshot después del cambio
     */
    public static function log($modulo, $accion, $tabla, $registro_id = null, $datos_anteriores = null, $datos_nuevos = null)
    {
        try {
            SysAuditoriaLog::create([
                'usuario_id' => auth()->id() ?? null, // Null si es acción de sistema o login fallido
                'modulo' => strtoupper($modulo),
                'accion' => strtoupper($accion),
                'tabla_afectada' => strtolower($tabla),
                'registro_id' => $registro_id,
                'datos_anteriores' => $datos_anteriores, // Cast automático a JSON por el Modelo
                'datos_nuevos' => $datos_nuevos,
                'ip_usuario' => request()->ip(),
                'navegador_info' => substr(request()->userAgent(), 0, 250),
                'fecha' => now()
            ]);
        } catch (\Exception $e) {
            // Silenciar error de auditoría para no detener la operación principal
            // Log::error("Error registrando auditoría: " . $e->getMessage());
        }
    }
}
