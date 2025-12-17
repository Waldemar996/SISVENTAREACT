<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Reportes
Route::prefix('reportes')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Reportes\ReporteController::class, 'dashboard']);
    Route::get('/ventas', [\App\Http\Controllers\Reportes\ReporteController::class, 'getVentasDetalladas']);
    Route::get('/compras', [\App\Http\Controllers\Reportes\ReporteController::class, 'getComprasDetalladas']);
    Route::get('/cajas', [\App\Http\Controllers\Reportes\ReporteController::class, 'getHistorialCajas']);
    Route::get('/kardex', [\App\Http\Controllers\Reportes\ReporteController::class, 'getKardex']);
    Route::get('/inventario', [\App\Http\Controllers\Reportes\ReporteController::class, 'getInventarioValorizado']);
    Route::get('/cxc', [\App\Http\Controllers\Reportes\ReporteController::class, 'getCuentasPorCobrar']);
});
Route::middleware('auth')->get('/user', [\App\Http\Controllers\AuthController::class, 'user']);

// Rutas Protegidas del ERP (usando auth para compatibilidad con Inertia)
Route::middleware(['auth'])->group(function () {

    // --- MÓDULO RRHH ---
    Route::apiResource('rrhh/empleados', \App\Http\Controllers\RRHH\RrhhEmpleadoController::class);
    Route::apiResource('rrhh/puestos', \App\Http\Controllers\RRHH\RrhhPuestoController::class);
    Route::apiResource('rrhh/departamentos', \App\Http\Controllers\RRHH\RrhhDepartamentoController::class);
    Route::apiResource('usuarios', \App\Http\Controllers\RRHH\SysUsuarioController::class);

    // --- MÓDULO INVENTARIO ---
    Route::apiResource('inventario/categorias', \App\Http\Controllers\Inventario\InvCategoriaController::class);
    Route::apiResource('inventario/productos', \App\Http\Controllers\Inventario\InvProductoController::class);
    Route::apiResource('inventario/bodegas', \App\Http\Controllers\Inventario\InvBodegaController::class);
    Route::apiResource('inventario/marcas', \App\Http\Controllers\Inventario\InvMarcaController::class);
    Route::apiResource('inventario/unidades', \App\Http\Controllers\Inventario\InvUnidadController::class);
    Route::apiResource('inventario/lotes', \App\Http\Controllers\Inventario\InvLoteController::class);
    Route::apiResource('inventario/series', \App\Http\Controllers\Inventario\InvSerieController::class);
    Route::get('inventario/kardex/consultar', [\App\Http\Controllers\Inventario\InvKardexController::class, 'consultar']);
    // Producción
    Route::apiResource('produccion/formulas', \App\Http\Controllers\Inventario\ProdFormulaController::class);
    Route::post('produccion/ordenes/{id}/finalizar', [\App\Http\Controllers\Inventario\ProdOrdenController::class, 'finalizar']);
    Route::apiResource('produccion/ordenes', \App\Http\Controllers\Inventario\ProdOrdenController::class);

    // --- MÓDULO COMERCIAL ---
    Route::apiResource('comercial/clientes', \App\Http\Controllers\Comercial\ComClienteController::class);
    Route::apiResource('comercial/proveedores', \App\Http\Controllers\Comercial\ComProveedorController::class);
    Route::patch('comercial/cotizaciones/{id}/estado', [\App\Http\Controllers\Comercial\ComCotizacionController::class, 'cambiarEstado']);
    Route::post('comercial/cotizaciones/{id}/duplicar', [\App\Http\Controllers\Comercial\ComCotizacionController::class, 'duplicar']);
    Route::post('comercial/cotizaciones/{id}/convertir', [\App\Http\Controllers\Comercial\ComCotizacionController::class, 'convertirAVenta']);
    Route::apiResource('comercial/cotizaciones', \App\Http\Controllers\Comercial\ComCotizacionController::class);

    // --- MÓDULO OPERACIONES ---
    Route::post('operaciones/ventas/{id}/anular', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'destroy'])->middleware('permission:ventas.anular');
    Route::get('operaciones/ventas/buscar', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'search'])->middleware('permission:ventas.ver');
    Route::apiResource('operaciones/ventas', \App\Http\Controllers\Operaciones\OperVentaController::class)
        ->only(['index', 'show', 'store', 'destroy']); // Explicit

    // Manual Middleware application for Resource methods is tricky in route definition if not using controller constructor.
    // Ideally we apply to specific methods or controller. Let's apply individually or use controller constructor.
    // For now, let's explicit routes or rely on mapped verification testing.
    // Actually, simpler to apply to single routes:

    // Overriding create/store
    Route::post('operaciones/ventas', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'store'])->middleware('permission:ventas.crear');
    Route::post('operaciones/ventas/calcular-totales', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'calculateTotals'])->middleware('permission:ventas.crear'); // Helper Endpoint
    Route::get('operaciones/ventas', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'index'])->middleware('permission:ventas.ver');
    Route::get('operaciones/ventas/{venta}', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'show'])->middleware('permission:ventas.ver');

    // Inventario Adjustments
    Route::post('inventario/ajustes', [\App\Http\Controllers\Inventario\InvAjusteController::class, 'store'])->middleware('permission:inventario.ajustar');

    Route::post('operaciones/compras/{id}/anular', [\App\Http\Controllers\Operaciones\OperCompraController::class, 'destroy']);
    Route::post('operaciones/compras/{id}/recibir', [\App\Http\Controllers\Operaciones\OperCompraController::class, 'recibir']); // New Route
    Route::apiResource('operaciones/compras', \App\Http\Controllers\Operaciones\OperCompraController::class);
    Route::apiResource('operaciones/traslados', \App\Http\Controllers\Operaciones\OperTrasladoController::class);
    Route::apiResource('operaciones/devoluciones', \App\Http\Controllers\Operaciones\OperDevolucionController::class);

    // --- MÓDULO TESORERÍA Y FINANZAS ---
    Route::apiResource('tesoreria/cajas', \App\Http\Controllers\Tesoreria\TesCajaController::class);

    // Rutas personalizadas para control de sesiones (Avanzado)
    Route::get('tesoreria/sesion/estado', [\App\Http\Controllers\Tesoreria\TesSesionCajaController::class, 'getEstado']);
    Route::post('tesoreria/sesion/aperturar', [\App\Http\Controllers\Tesoreria\TesSesionCajaController::class, 'aperturar']);
    Route::post('tesoreria/sesion/cerrar', [\App\Http\Controllers\Tesoreria\TesSesionCajaController::class, 'cerrar']);
    Route::apiResource('tesoreria/sesiones', \App\Http\Controllers\Tesoreria\TesSesionCajaController::class)->only(['index', 'show']);
    Route::get('finanzas/categorias-gastos', [\App\Http\Controllers\Finanzas\FinGastoController::class, 'categorias']);
    Route::apiResource('finanzas/gastos', \App\Http\Controllers\Finanzas\FinGastoController::class);
    Route::apiResource('finanzas/pagos-clientes', \App\Http\Controllers\Finanzas\FinPagoClienteController::class);
    Route::apiResource('finanzas/pagos-proveedores', \App\Http\Controllers\Finanzas\FinPagoProveedorController::class);

    // CXC y CXP (Sprint 1)
    Route::apiResource('finanzas/cuentas-por-cobrar', \App\Http\Controllers\Finanzas\FinCuentaPorCobrarController::class);
    Route::post('finanzas/cuentas-por-cobrar/{id}/pago', [\App\Http\Controllers\Finanzas\FinCuentaPorCobrarController::class, 'registrarPago']);
    Route::apiResource('finanzas/cuentas-por-pagar', \App\Http\Controllers\Finanzas\FinCuentaPorPagarController::class);
    Route::post('finanzas/cuentas-por-pagar/{id}/pago', [\App\Http\Controllers\Finanzas\FinCuentaPorPagarController::class, 'registrarPago']);

    // --- MÓDULO LOGÍSTICA ---
    Route::apiResource('logistica/bodegas', \App\Http\Controllers\Inventario\InvBodegaController::class);
    Route::apiResource('logistica/traslados', \App\Http\Controllers\Operaciones\OperTrasladoController::class);
    Route::post('logistica/traslados/{id}/aprobar', [\App\Http\Controllers\Operaciones\OperTrasladoController::class, 'aprobar']);
    Route::post('logistica/traslados/{id}/rechazar', [\App\Http\Controllers\Operaciones\OperTrasladoController::class, 'rechazar']);

    // --- MÓDULO CONTABILIDAD (Sprint 2) ---
    Route::apiResource('contabilidad/cuentas', \App\Http\Controllers\Contabilidad\ContCuentaController::class);
    Route::apiResource('contabilidad/partidas', \App\Http\Controllers\Contabilidad\ContPartidaController::class);
    Route::post('contabilidad/partidas/{id}/anular', [\App\Http\Controllers\Contabilidad\ContPartidaController::class, 'anular']);

    // --- MÓDULO CONFIGURACIÓN ---
    Route::get('configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'index']);
    Route::post('configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'update']);

    // Configuración Avanzada (Sprint 2 y 3)
    Route::get('configuracion/empresa', [\App\Http\Controllers\Config\SysEmpresaController::class, 'index']);
    Route::post('configuracion/empresa', [\App\Http\Controllers\Config\SysEmpresaController::class, 'store']);
    Route::put('configuracion/empresa/{id}', [\App\Http\Controllers\Config\SysEmpresaController::class, 'update']);
    Route::apiResource('configuracion/impuestos', \App\Http\Controllers\Config\SysImpuestoController::class);
    Route::apiResource('configuracion/series', \App\Http\Controllers\Config\SysSerieController::class);

    Route::get('auditoria', [\App\Http\Controllers\Config\SysAuditoriaController::class, 'index']);

    // --- MÓDULO SEGURIDAD ---
    Route::apiResource('seguridad/usuarios', \App\Http\Controllers\System\SysUsuarioController::class);

});
