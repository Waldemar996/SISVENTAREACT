<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route; // For Route::has checks if needed, passed as props
use Illuminate\Foundation\Application; // for welcome page

class PageController extends Controller
{
    public function welcome()
    {
        return Inertia::render('Welcome', [
            'canLogin' => \Illuminate\Support\Facades\Route::has('login'),
            'canRegister' => \Illuminate\Support\Facades\Route::has('register'),
            'laravelVersion' => \Illuminate\Foundation\Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    }

    // Generic render for simple static pages
    // Usage: Route::get('path', [PageController::class, 'render'])->defaults('page', 'ComponentName');
    // But defaults don't work easily with caching sometimes.
    // Explicit methods are safer.

    // Inventory
    public function inventoryProducts() { return Inertia::render('Inventario/Productos/Index'); }
    public function inventoryCategories() { return Inertia::render('Inventario/Categorias/Index'); }
    public function inventoryBrands() { return Inertia::render('Inventario/Marcas/Index'); }
    public function inventoryUnits() { return Inertia::render('Inventario/Unidades/Index'); }
    public function inventoryKardex() { return Inertia::render('Inventario/Kardex/Index'); }
    public function inventoryLots() { return Inertia::render('Inventario/Lotes/Manager'); }

    // Operations
    public function salesIndex() { return Inertia::render('Operaciones/Ventas/Index'); }
    public function salesCreate() { return Inertia::render('Operaciones/Ventas/Create'); }
    public function purchasesIndex() { return Inertia::render('Operaciones/Compras/Index'); }
    public function purchasesCreate() { return Inertia::render('Operaciones/Compras/Create'); }
    public function posLegacy() { return Inertia::render('Operaciones/POS/Index'); }
    public function returnsIndex() { return Inertia::render('Operaciones/Devoluciones/Index'); }

    // Reports
    public function reportsIndex() { return Inertia::render('Reportes/Index'); }

    // RRHH
    public function rrhhEmployees() { return Inertia::render('RRHH/Empleados/Index'); }
    public function rrhhDepartments() { return Inertia::render('RRHH/Departamentos/Index'); }
    public function rrhhPositions() { return Inertia::render('RRHH/Puestos/Index'); }

    // Production
    public function prodFormulas() { return Inertia::render('Produccion/Formulas/Index'); }
    public function prodOrders() { return Inertia::render('Produccion/Ordenes/Manager'); }

    // Commercial
    public function clientsIndex() { return Inertia::render('Comercial/Clientes/Index'); }
    public function suppliersIndex() { return Inertia::render('Comercial/Proveedores/Index'); }
    public function quotesIndex() { return Inertia::render('Comercial/Cotizaciones/Index'); }
    public function quotesCreate() { return Inertia::render('Comercial/Cotizaciones/Create'); }

    // Finances
    public function expensesIndex() { return Inertia::render('Finanzas/Gastos/Index'); }
    public function cxcIndex() { return Inertia::render('Finanzas/PagosClientes/Index'); }
    public function cxpIndex() { return Inertia::render('Finanzas/PagosProveedores/Index'); }
    // Accounting
    public function accAccounts() { return Inertia::render('Contabilidad/Cuentas/Index'); }
    public function accEntries() { return Inertia::render('Contabilidad/Partidas/Index'); }

    // Treasury
    public function treasuryBoxes() { return Inertia::render('Tesoreria/Cajas/Index'); }
    public function treasurySessionsControl() { return Inertia::render('Tesoreria/Sesiones/Control'); }
    public function treasurySessionsIndex() { return Inertia::render('Tesoreria/Sesiones/Index'); }

    // Logistics
    public function logWarehouses() { return Inertia::render('Logistica/Bodegas/Index'); }
    public function logTransfers() { return Inertia::render('Logistica/Traslados/Index'); }

    // Config
    public function configIndex() { return Inertia::render('Configuracion/Index'); }
    public function configCompany() { return Inertia::render('Configuracion/Empresa/Index'); }
    public function configTaxes() { return Inertia::render('Configuracion/Impuestos/Index'); }
    public function configSeries() { return Inertia::render('Configuracion/Series/Index'); }
    public function auditIndex() { return Inertia::render('Auditoria/Index'); }
    
    // Security
    public function securityUsers() { return Inertia::render('Seguridad/Usuarios/Index'); }

    // Enterprise New
    public function entSalesPos() { return Inertia::render('Sales/POS'); }
    public function entInvManaged() { return Inertia::render('Inventory/Products'); }
    public function entRepSales() { return Inertia::render('Reports/Sales'); }
    public function entUsersManage() { return Inertia::render('Users/Manage'); }
    public function entUsersRoles() { return Inertia::render('Users/Roles'); }
}
