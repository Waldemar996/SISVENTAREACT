// Reemplazo simple para route() de Ziggy
// Este archivo proporciona una función route() que funciona sin Ziggy

const routes = {
    'dashboard': '/dashboard',
    'login': '/login',
    'logout': '/logout',
    'register': '/register',
    'inventario.productos': '/inventario/productos',
    'rrhh.empleados': '/rrhh/empleados',
    'comercial.clientes': '/comercial/clientes',
    'comercial.cotizaciones': '/comercial/cotizaciones',
    'produccion.formulas': '/produccion/formulas',
    'tesoreria.cajas': '/tesoreria/cajas',
    'logistica.bodegas': '/logistica/bodegas',
    'finanzas.gastos': '/finanzas/gastos',
    'sys.configuracion': '/configuracion',
    'profile.edit': '/profile',
    'profile.update': '/profile',
    'profile.destroy': '/profile',
    'password.confirm': '/confirm-password',
    'password.email': '/forgot-password',
    'password.store': '/reset-password',
    'password.update': '/password',
    'verification.send': '/email/verification-notification',
    'operaciones.compras.store': '/api/operaciones/compras',
};

// Función route() simple
window.route = function (name, params) {
    const url = routes[name] || '/';

    // Soporte para route().current()
    if (typeof name === 'undefined') {
        return {
            current: function (checkName) {
                const currentPath = window.location.pathname;
                const routePath = routes[checkName];
                return currentPath === routePath;
            }
        };
    }

    return url;
};

export default window.route;
