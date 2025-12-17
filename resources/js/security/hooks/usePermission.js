import { usePage } from '@inertiajs/react';

// Hook to check permissions from Inertia shared props
export function usePermission() {
    const { auth } = usePage().props;
    const user = auth?.user;
    // Assuming backend sends permissions array or roles
    // We will align this with HandleInertiaRequests middleware

    // Check if user has specific permission
    const can = (permission) => {
        if (!user) return false;
        if (user.roles && user.roles.some(r => r.name === 'superadmin')) return true;

        return user.permissions ? user.permissions.includes(permission) : false;
    };

    // Check if user has specific role
    const hasRole = (role) => {
        if (!user) return false;
        return user.roles ? user.roles.some(r => r.name === role) : false;
    };

    return { user, can, hasRole };
}
