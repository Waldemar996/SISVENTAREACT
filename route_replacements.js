// Script para reemplazar route() con URLs directas
const replacements = {
    // Dashboard y navegación
    "route('dashboard')": "'/dashboard'",
    "route('login')": "'/login'",
    "route('logout')": "'/logout'",
    "route('register')": "'/register'",

    // Inventario
    "route('inventario.productos')": "'/inventario/productos'",

    // RRHH
    "route('rrhh.empleados')": "'/rrhh/empleados'",

    // Comercial
    "route('comercial.clientes')": "'/comercial/clientes'",
    "route('comercial.cotizaciones')": "'/comercial/cotizaciones'",

    // Producción
    "route('produccion.formulas')": "'/produccion/formulas'",

    // Tesorería
    "route('tesoreria.cajas')": "'/tesoreria/cajas'",

    // Logística
    "route('logistica.bodegas')": "'/logistica/bodegas'",

    // Finanzas
    "route('finanzas.gastos')": "'/finanzas/gastos'",

    // Sistema
    "route('sys.configuracion')": "'/configuracion'",

    // Profile
    "route('profile.edit')": "'/profile'",
    "route('profile.update')": "'/profile'",
    "route('profile.destroy')": "'/profile'",

    // Password
    "route('password.confirm')": "'/confirm-password'",
    "route('password.email')": "'/forgot-password'",
    "route('password.store')": "'/reset-password'",
    "route('password.update')": "'/password'",

    // Verification
    "route('verification.send')": "'/email/verification-notification'",

    // Operaciones
    "route('operaciones.compras.store')": "'/api/operaciones/compras'",
};

console.log('Reemplazos a realizar:', Object.keys(replacements).length);
