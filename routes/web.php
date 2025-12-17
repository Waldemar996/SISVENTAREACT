<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [\App\Http\Controllers\PageController::class, 'welcome']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // Módulo Inventario
    Route::get('/inventario/productos', [\App\Http\Controllers\PageController::class, 'inventoryProducts'])->name('inventario.productos');

    // Módulo Ventas (POS y Listado)
    Route::get('/operaciones/ventas', [\App\Http\Controllers\PageController::class, 'salesIndex'])->name('operaciones.ventas.index');
    Route::get('/operaciones/ventas/crear', [\App\Http\Controllers\PageController::class, 'salesCreate'])->name('operaciones.ventas.crear');

    // Módulo Compras
    Route::get('/operaciones/compras', [\App\Http\Controllers\PageController::class, 'purchasesIndex'])->name('operaciones.compras.index');
    Route::get('/operaciones/compras/crear', [\App\Http\Controllers\PageController::class, 'purchasesCreate'])->name('operaciones.compras.crear');

    // Reportes
    Route::get('/reportes', [\App\Http\Controllers\PageController::class, 'reportsIndex'])->name('reportes.index');

    // RRHH
    Route::get('/rrhh/empleados', [\App\Http\Controllers\PageController::class, 'rrhhEmployees'])->name('rrhh.empleados');
    Route::get('/rrhh/departamentos', [\App\Http\Controllers\PageController::class, 'rrhhDepartments'])->name('rrhh.departamentos');
    Route::get('/rrhh/puestos', [\App\Http\Controllers\PageController::class, 'rrhhPositions'])->name('rrhh.puestos');

    // Módulo Inventario
    Route::get('/inventario/categorias', [\App\Http\Controllers\PageController::class, 'inventoryCategories'])->name('inventario.categorias');
    Route::get('/inventario/marcas', [\App\Http\Controllers\PageController::class, 'inventoryBrands'])->name('inventario.marcas');
    Route::get('/inventario/unidades', [\App\Http\Controllers\PageController::class, 'inventoryUnits'])->name('inventario.unidades');

    // Inventario Avanzado
    Route::get('/inventario/kardex', [\App\Http\Controllers\PageController::class, 'inventoryKardex'])->name('inventario.kardex');
    Route::get('/inventario/lotes', [\App\Http\Controllers\PageController::class, 'inventoryLots'])->name('inventario.lotes');

    // Módulo Producción
    Route::get('/produccion/formulas', [\App\Http\Controllers\PageController::class, 'prodFormulas'])->name('produccion.formulas');
    Route::get('/produccion/ordenes', [\App\Http\Controllers\PageController::class, 'prodOrders'])->name('produccion.ordenes');

    // Módulo Comercial
    Route::get('/comercial/clientes', [\App\Http\Controllers\PageController::class, 'clientsIndex'])->name('comercial.clientes');
    Route::get('/comercial/proveedores', [\App\Http\Controllers\PageController::class, 'suppliersIndex'])->name('comercial.proveedores');

    // Módulo Cotizaciones (Avanzado)
    Route::get('/comercial/cotizaciones', [\App\Http\Controllers\PageController::class, 'quotesIndex'])->name('comercial.cotizaciones');
    Route::get('/comercial/cotizaciones/crear', [\App\Http\Controllers\PageController::class, 'quotesCreate'])->name('comercial.cotizaciones.crear');

    // Finanzas
    Route::get('/finanzas/gastos', [\App\Http\Controllers\PageController::class, 'expensesIndex'])->name('finanzas.gastos');

    // Módulo Tesorería (Avanzado)
    Route::get('/tesoreria/cajas', [\App\Http\Controllers\PageController::class, 'treasuryBoxes'])->name('tesoreria.cajas');
    Route::get('/tesoreria/sesiones', [\App\Http\Controllers\PageController::class, 'treasurySessionsControl'])->name('tesoreria.sesiones');
    Route::get('/tesoreria/historial-cortes', [\App\Http\Controllers\PageController::class, 'treasurySessionsIndex'])->name('tesoreria.historial');
    Route::get('/tesoreria/sesion/{id}/ticket', [\App\Http\Controllers\Tesoreria\TesSesionCajaController::class, 'ticket'])->name('tesoreria.sesion.ticket');

    // Reportes PDF
    Route::get('/reportes/pdf/ventas', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadVentas'])->name('reportes.pdf.ventas');
    Route::get('/reportes/pdf/compras', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadCompras'])->name('reportes.pdf.compras');
    Route::get('/reportes/pdf/cajas', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadHistorialCajas'])->name('reportes.pdf.cajas');
    Route::get('/reportes/pdf/kardex', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadKardex'])->name('reportes.pdf.kardex');
    Route::get('/reportes/pdf/inventario', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadInventario'])->name('reportes.pdf.inventario');
    Route::get('/reportes/pdf/cxc', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadCxc'])->name('reportes.pdf.cxc');

    // Módulo Finanzas (CXC / CXP)
    Route::get('/finanzas/cxc', [\App\Http\Controllers\PageController::class, 'cxcIndex'])->name('finanzas.cxc');
    Route::get('/finanzas/cxp', [\App\Http\Controllers\PageController::class, 'cxpIndex'])->name('finanzas.cxp');
    // duplicate route name removed, expenses already above
    // Route::get('/finanzas/gastos', ...)->name('finanzas.gastos');

    // Módulo Configuración
    Route::get('/configuracion', [\App\Http\Controllers\PageController::class, 'configIndex'])->name('configuracion.index');
    Route::get('/api/configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'index']); 
    Route::post('/api/configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'update']); 

    // Operaciones Especiales (Devoluciones)
    Route::get('/operaciones/devoluciones', [\App\Http\Controllers\PageController::class, 'returnsIndex'])->name('operaciones.devoluciones');

    // Configuración y Auditoría
    Route::get('/auditoria', [\App\Http\Controllers\PageController::class, 'auditIndex'])->name('sys.auditoria');
    Route::get('/seguridad/usuarios', [\App\Http\Controllers\PageController::class, 'securityUsers'])->name('sys.usuarios');

    // Imprimir Cotización
    Route::get('/comercial/cotizaciones/{id}/print', [\App\Http\Controllers\Comercial\ComCotizacionController::class, 'print'])->name('comercial.cotizaciones.print');
    
    // Imprimir Venta
    Route::get('/operaciones/ventas/{id}/print', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'print'])->name('operaciones.ventas.print');
    Route::get('/operaciones/ventas/{id}/ticket', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'ticket'])->name('operaciones.ventas.ticket');

    // Módulo Logística
    Route::get('/logistica/bodegas', [\App\Http\Controllers\PageController::class, 'logWarehouses'])->name('logistica.bodegas');
    Route::get('/logistica/traslados', [\App\Http\Controllers\PageController::class, 'logTransfers'])->name('logistica.traslados');

    // Módulo Contabilidad
    Route::get('/contabilidad/cuentas', [\App\Http\Controllers\PageController::class, 'accAccounts'])->name('contabilidad.cuentas');
    Route::get('/contabilidad/partidas', [\App\Http\Controllers\PageController::class, 'accEntries'])->name('contabilidad.partidas');

    // Módulo Configuración Avanzada
    Route::get('/configuracion/empresa', [\App\Http\Controllers\PageController::class, 'configCompany'])->name('configuracion.empresa');
    Route::get('/configuracion/impuestos', [\App\Http\Controllers\PageController::class, 'configTaxes'])->name('configuracion.impuestos');
    Route::get('/configuracion/series', [\App\Http\Controllers\PageController::class, 'configSeries'])->name('configuracion.series');

    // Módulo POS (Legacy)
    Route::get('/operaciones/pos', [\App\Http\Controllers\PageController::class, 'posLegacy'])->name('operaciones.pos');

    // [ENTERPRISE] New Module-based POS
    Route::get('/sales/pos', [\App\Http\Controllers\PageController::class, 'entSalesPos'])->name('sales.pos');

    // [ENTERPRISE] New Module-based Inventory
    Route::get('/inventory/managed-products', [\App\Http\Controllers\PageController::class, 'entInvManaged'])->name('inventory.managed_products');

    // [ENTERPRISE] New Module-based Reports
    Route::get('/reports/sales-performance', [\App\Http\Controllers\PageController::class, 'entRepSales'])->name('reports.sales_performance');

    // [ENTERPRISE] New Module-based Users
    Route::get('/users/manage', [\App\Http\Controllers\PageController::class, 'entUsersManage'])->name('users.manage');

    Route::get('/users/roles', [\App\Http\Controllers\PageController::class, 'entUsersRoles'])->name('users.roles');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

use App\Http\Controllers\AuthController;

Route::post('/custom-login', [AuthController::class, 'login']);
Route::post('/custom-logout', [AuthController::class, 'logout']);

require __DIR__.'/auth.php';
