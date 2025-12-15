<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // Módulo Inventario
    Route::get('/inventario/productos', function () {
        return Inertia::render('Inventario/Productos/Index');
    })->name('inventario.productos');
    
    // Módulo Ventas (POS y Listado)
    Route::get('/operaciones/ventas', function () {
        return Inertia::render('Operaciones/Ventas/Index');
    })->name('operaciones.ventas.index');

    Route::get('/operaciones/ventas/crear', function () {
        return Inertia::render('Operaciones/Ventas/Create');
    })->name('operaciones.ventas.crear');

    // Módulo Compras
    Route::get('/operaciones/compras', function () {
        return Inertia::render('Operaciones/Compras/Index');
    })->name('operaciones.compras.index');

    Route::get('/operaciones/compras/crear', function () {
        return Inertia::render('Operaciones/Compras/Create');
    })->name('operaciones.compras.crear');

    // Reportes
    Route::get('/reportes', function () {
        return Inertia::render('Reportes/Index');
    })->name('reportes.index');

    // RRHH
    Route::get('/rrhh/empleados', function () {
        return Inertia::render('RRHH/Empleados/Index');
    })->name('rrhh.empleados');
    Route::get('/rrhh/departamentos', function () {
        return Inertia::render('RRHH/Departamentos/Index');
    })->name('rrhh.departamentos');
    Route::get('/rrhh/puestos', function () {
        return Inertia::render('RRHH/Puestos/Index');
    })->name('rrhh.puestos');

    // Módulo Inventario
    Route::get('/inventario/categorias', function () {
        return Inertia::render('Inventario/Categorias/Index');
    })->name('inventario.categorias');
    Route::get('/inventario/marcas', function () {
        return Inertia::render('Inventario/Marcas/Index');
    })->name('inventario.marcas');
    Route::get('/inventario/unidades', function () {
        return Inertia::render('Inventario/Unidades/Index');
    })->name('inventario.unidades');

    // Inventario Avanzado
    Route::get('/inventario/kardex', function () {
        return Inertia::render('Inventario/Kardex/Index');
    })->name('inventario.kardex');
    Route::get('/inventario/lotes', function () {
        return Inertia::render('Inventario/Lotes/Manager');
    })->name('inventario.lotes');

    // Módulo Producción
    Route::get('/produccion/formulas', function () {
        return Inertia::render('Produccion/Formulas/Index');
    })->name('produccion.formulas');
    Route::get('/produccion/ordenes', function () {
        return Inertia::render('Produccion/Ordenes/Manager');
    })->name('produccion.ordenes');

    // Módulo Comercial
    Route::get('/comercial/clientes', function () {
        return Inertia::render('Comercial/Clientes/Index');
    })->name('comercial.clientes');
    Route::get('/comercial/proveedores', function () {
        return Inertia::render('Comercial/Proveedores/Index');
    })->name('comercial.proveedores');

    // Módulo Cotizaciones (Avanzado)
    Route::get('/comercial/cotizaciones', function () {
        return Inertia::render('Comercial/Cotizaciones/Index');
    })->name('comercial.cotizaciones');
    Route::get('/comercial/cotizaciones/crear', function () {
        return Inertia::render('Comercial/Cotizaciones/Create');
    })->name('comercial.cotizaciones.crear');

    // Finanzas
    Route::get('/finanzas/gastos', function () {
        return Inertia::render('Finanzas/Gastos/Index');
    })->name('finanzas.gastos');

    // Módulo Tesorería (Avanzado)
    Route::get('/tesoreria/cajas', function () {
        return Inertia::render('Tesoreria/Cajas/Index');
    })->name('tesoreria.cajas');

    Route::get('/tesoreria/sesiones', function () {
        return Inertia::render('Tesoreria/Sesiones/Control');
    })->name('tesoreria.sesiones');

    Route::get('/tesoreria/historial-cortes', function () {
        return Inertia::render('Tesoreria/Sesiones/Index');
    })->name('tesoreria.historial');
    
    Route::get('/tesoreria/sesion/{id}/ticket', [\App\Http\Controllers\Tesoreria\TesSesionCajaController::class, 'ticket'])->name('tesoreria.sesion.ticket');

    // Reportes PDF
    Route::get('/reportes/pdf/ventas', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadVentas'])->name('reportes.pdf.ventas');
    Route::get('/reportes/pdf/compras', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadCompras'])->name('reportes.pdf.compras');
    Route::get('/reportes/pdf/cajas', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadHistorialCajas'])->name('reportes.pdf.cajas');
    Route::get('/reportes/pdf/kardex', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadKardex'])->name('reportes.pdf.kardex');
    Route::get('/reportes/pdf/inventario', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadInventario'])->name('reportes.pdf.inventario');
    Route::get('/reportes/pdf/cxc', [\App\Http\Controllers\Reportes\PdfReporteController::class, 'downloadCxc'])->name('reportes.pdf.cxc');

    // Módulo Finanzas (CXC / CXP)
    Route::get('/finanzas/cxc', function () {
        return Inertia::render('Finanzas/PagosClientes/Index');
    })->name('finanzas.cxc');
    Route::get('/finanzas/cxp', function () {
        return Inertia::render('Finanzas/PagosProveedores/Index');
    })->name('finanzas.cxp');
    Route::get('/finanzas/gastos', function () {
        return Inertia::render('Finanzas/Gastos/Index');
    })->name('finanzas.gastos');

    // Módulo Configuración
    Route::get('/configuracion', function () {
        return Inertia::render('Configuracion/Index');
    })->name('configuracion.index');
    Route::get('/api/configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'index']); // For loading initial data
    Route::post('/api/configuracion', [\App\Http\Controllers\Config\SysConfiguracionController::class, 'update']); // Use POST with _method=PUT for FormData compatibility

    // Operaciones Especiales (Devoluciones)
    Route::get('/operaciones/devoluciones', function () {
        return Inertia::render('Operaciones/Devoluciones/Index');
    })->name('operaciones.devoluciones');

    // Configuración y Auditoría
    Route::get('/configuracion', function () {
        return Inertia::render('Configuracion/Index');
    })->name('sys.configuracion');

    Route::get('/auditoria', function () {
        return Inertia::render('Auditoria/Index');
    })->name('sys.auditoria');
    
    Route::get('/seguridad/usuarios', function () {
        return Inertia::render('Seguridad/Usuarios/Index');
    })->name('sys.usuarios');

    // Imprimir Cotización
    Route::get('/comercial/cotizaciones/{id}/print', function ($id) {
        $cotizacion = \App\Models\Comercial\ComCotizacion::with(['cliente', 'detalles.producto.marca', 'usuario'])->findOrFail($id);
        $empresa = \App\Models\Config\SysConfiguracion::first(); // Pass global config
        return Inertia::render('Comercial/Cotizaciones/Print', [
            'cotizacion' => $cotizacion,
            'empresa' => $empresa
        ]);
    })->name('comercial.cotizaciones.print');

    // Imprimir Venta (usa Controller para lógica unificada)
    Route::get('/operaciones/ventas/{id}/print', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'print'])->name('operaciones.ventas.print');
    Route::get('/operaciones/ventas/{id}/ticket', [\App\Http\Controllers\Operaciones\OperVentaController::class, 'ticket'])->name('operaciones.ventas.ticket');

    // Módulo Logística
    Route::get('/logistica/bodegas', function () {
        return Inertia::render('Logistica/Bodegas/Index');
    })->name('logistica.bodegas');
    Route::get('/logistica/traslados', function () {
        return Inertia::render('Logistica/Traslados/Index');
    })->name('logistica.traslados');

    // Módulo Contabilidad
    Route::get('/contabilidad/cuentas', function () {
        return Inertia::render('Contabilidad/Cuentas/Index');
    })->name('contabilidad.cuentas');
    Route::get('/contabilidad/partidas', function () {
        return Inertia::render('Contabilidad/Partidas/Index');
    })->name('contabilidad.partidas');

    // Módulo Configuración Avanzada
    Route::get('/configuracion/empresa', function () {
        return Inertia::render('Configuracion/Empresa/Index');
    })->name('configuracion.empresa');
    Route::get('/configuracion/impuestos', function () {
        return Inertia::render('Configuracion/Impuestos/Index');
    })->name('configuracion.impuestos');
    Route::get('/configuracion/series', function () {
        return Inertia::render('Configuracion/Series/Index');
    })->name('configuracion.series');

    // Módulo POS
    Route::get('/operaciones/pos', function () {
        return Inertia::render('Operaciones/POS/Index');
    })->name('operaciones.pos');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


use App\Http\Controllers\AuthController;

Route::post('/custom-login', [AuthController::class, 'login']);
Route::post('/custom-logout', [AuthController::class, 'logout']);

require __DIR__.'/auth.php';
