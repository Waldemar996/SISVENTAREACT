<?php

namespace App\Domain\Security;

class PermissionService
{
    /**
     * Define Mapping of Roles to Permissions.
     * In a full DB implementation, this would cache from sys_permissions tables.
     */
    private static array $rolePermissions = [
        'superadmin' => ['*'], // Dios
        'admin' => [
            'ventas.ver', 'ventas.crear', 'ventas.anular',
            'inventario.ver', 'inventario.ajustar',
            'reportes.ver',
            'usuarios.ver', 'usuarios.crear',
        ],
        'cajero' => [
            'ventas.ver', 'ventas.crear', // Cannot annul
            'clientes.ver', 'clientes.crear',
            'inventario.ver', // Read only stock
        ],
        'bodeguero' => [
            'inventario.ver', 'inventario.ajustar',
            'compras.ver', 'compras.crear',
        ],
    ];

    public static function hasPermission(string $role, string $permission): bool
    {
        $role = strtolower($role);

        if (! isset(self::$rolePermissions[$role])) {
            return false;
        }

        $perms = self::$rolePermissions[$role];

        // Superadmin wildcard
        if (in_array('*', $perms)) {
            return true;
        }

        return in_array($permission, $perms);
    }
}
