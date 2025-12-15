<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AllModulesSeeder extends Seeder
{
    /**
     * Seed all modules with comprehensive test data
     */
    public function run()
    {
        echo "🚀 Poblando TODOS los módulos del sistema...\n\n";

        // 1. Usuarios (si no existen)
        $this->seedUsuarios();
        
        // 2. Empleados
        $this->seedEmpleados();
        
        // 3. Productos y Categorías
        $this->seedProductos();
        
        // 4. Clientes
        $this->seedClientes();
        
        // 5. Proveedores
        $this->seedProveedores();
        
        // 6. Ventas
        $this->seedVentas();
        
        // 7. Compras
        $this->seedCompras();
        
        // 8. Bodegas
        $this->seedBodegas();
        
        // 9. Cajas
        $this->seedCajas();
        
        // 10. Gastos
        $this->seedGastos();

        // 11. Contabilidad (Chart of Accounts)
        $this->seedContabilidad();
        
        echo "\n✅ TODOS LOS MÓDULOS POBLADOS EXITOSAMENTE\n";
    }

    private function seedUsuarios()
    {
        $count = DB::table('sys_usuarios')->count();
        if ($count > 0) {
            echo "ℹ️  Usuarios ya existen: $count\n";
            return;
        }

        DB::table('sys_usuarios')->insert([
            [
                'username' => 'admin',
                'email' => 'admin@sistema.com',
                'password' => Hash::make('123456'),
                'empleado_id' => 1,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'username' => 'vendedor',
                'email' => 'vendedor@sistema.com',
                'password' => Hash::make('123456'),
                'empleado_id' => 2,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        echo "✅ Usuarios creados: 2\n";
    }

    private function seedEmpleados()
    {
        $count = DB::table('rrhh_empleados')->count();
        if ($count >= 5) {
            echo "ℹ️  Empleados ya existen: $count\n";
            return;
        }

        // Asegurar que existan departamentos y puestos
        if (DB::table('rrhh_departamentos')->count() == 0) {
            DB::table('rrhh_departamentos')->insert([
                ['nombre' => 'Administración', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Ventas', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Inventario', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (DB::table('rrhh_puestos')->count() == 0) {
            DB::table('rrhh_puestos')->insert([
                ['nombre' => 'Gerente', 'departamento_id' => 1, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Vendedor', 'departamento_id' => 2, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Bodeguero', 'departamento_id' => 3, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        DB::table('rrhh_empleados')->delete();
        DB::table('rrhh_empleados')->insert([
            [
                'codigo' => 'EMP001',
                'nombres' => 'Juan Carlos',
                'apellidos' => 'García López',
                'dpi' => '1234567890101',
                'nit' => '12345678',
                'telefono' => '12345678',
                'email' => 'juan.garcia@empresa.com',
                'departamento_id' => 1,
                'puesto_id' => 1,
                'fecha_ingreso' => '2024-01-01',
                'salario_base' => 5000.00,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'codigo' => 'EMP002',
                'nombres' => 'María Elena',
                'apellidos' => 'Rodríguez Pérez',
                'dpi' => '1234567890102',
                'nit' => '12345679',
                'telefono' => '12345679',
                'email' => 'maria.rodriguez@empresa.com',
                'departamento_id' => 2,
                'puesto_id' => 2,
                'fecha_ingreso' => '2024-02-01',
                'salario_base' => 3500.00,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'codigo' => 'EMP003',
                'nombres' => 'Pedro Antonio',
                'apellidos' => 'Martínez Gómez',
                'dpi' => '1234567890103',
                'nit' => '12345680',
                'telefono' => '12345680',
                'email' => 'pedro.martinez@empresa.com',
                'departamento_id' => 3,
                'puesto_id' => 3,
                'fecha_ingreso' => '2024-03-01',
                'salario_base' => 3000.00,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        echo "✅ Empleados creados: 3\n";
    }

    private function seedProductos()
    {
        $count = DB::table('inv_productos')->count();
        if ($count >= 10) {
            echo "ℹ️  Productos ya existen: $count\n";
            return;
        }

        // Asegurar categorías
        if (DB::table('inv_categorias')->count() == 0) {
            DB::table('inv_categorias')->insert([
                ['nombre' => 'Electrónica', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Alimentos', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Ropa', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Asegurar marcas
        if (DB::table('inv_marcas')->count() == 0) {
            DB::table('inv_marcas')->insert([
                ['nombre' => 'Samsung', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Nestlé', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Nike', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Asegurar unidades
        if (DB::table('inv_unidades')->count() == 0) {
            DB::table('inv_unidades')->insert([
                ['nombre' => 'Unidad', 'abreviatura' => 'UND', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Caja', 'abreviatura' => 'CJA', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Kilogramo', 'abreviatura' => 'KG', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // No eliminar productos existentes por foreign keys
        $existingCount = DB::table('inv_productos')->count();
        if ($existingCount >= 15) {
            echo "ℹ️  Productos ya suficientes: $existingCount\n";
            return;
        }

        for ($i = $existingCount + 1; $i <= 15; $i++) {
            DB::table('inv_productos')->insert([
                'codigo_sku' => 'PROD' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'nombre' => 'Producto ' . $i,
                'descripcion' => 'Descripción del producto ' . $i,
                'categoria_id' => (($i - 1) % 3) + 1,
                'marca_id' => (($i - 1) % 3) + 1,
                'unidad_id' => (($i - 1) % 3) + 1,
                'precio_compra' => 50.00 + ($i * 10),
                'precio_venta_base' => 100.00 + ($i * 20),
                'stock_actual' => 50 + $i,
                'stock_minimo' => 10,
                'stock_maximo' => 100,
                'impuesto_id' => 1,
                'tipo' => 'producto',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Productos creados: 15\n";
    }

    private function seedClientes()
    {
        $count = DB::table('com_clientes')->count();
        if ($count >= 5) {
            echo "ℹ️  Clientes ya existen: $count\n";
            return;
        }

        $existingCount = DB::table('com_clientes')->count();
        if ($existingCount >= 10) {
            echo "ℹ️  Clientes ya suficientes: $existingCount\n";
            return;
        }

        for ($i = $existingCount + 1; $i <= 10; $i++) {
            DB::table('com_clientes')->insert([
                'codigo' => 'CLI' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'razon_social' => 'Cliente ' . $i . ' S.A.',
                'nombre_comercial' => 'Cliente ' . $i,
                'nit' => '12345678' . $i,
                'telefono' => '1234567' . $i,
                'email' => 'cliente' . $i . '@email.com',
                'direccion' => 'Dirección del cliente ' . $i,
                'tipo' => 'empresa',
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Clientes creados: 10\n";
    }

    private function seedProveedores()
    {
        $count = DB::table('com_proveedores')->count();
        if ($count >= 5) {
            echo "ℹ️  Proveedores ya existen: $count\n";
            return;
        }

        DB::table('com_proveedores')->delete();
        for ($i = 1; $i <= 8; $i++) {
            DB::table('com_proveedores')->insert([
                'codigo' => 'PROV' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'razon_social' => 'Proveedor ' . $i . ' S.A.',
                'nombre_comercial' => 'Proveedor ' . $i,
                'nit' => '87654321' . $i,
                'telefono' => '8765432' . $i,
                'email' => 'proveedor' . $i . '@email.com',
                'direccion' => 'Dirección del proveedor ' . $i,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Proveedores creados: 8\n";
    }

    private function seedVentas()
    {
        $count = DB::table('oper_ventas')->count();
        if ($count >= 5) {
            echo "ℹ️  Ventas ya existen: $count\n";
            return;
        }

        DB::table('oper_ventas')->delete();
        DB::table('oper_ventas_det')->delete();

        for ($i = 1; $i <= 5; $i++) {
            $ventaId = DB::table('oper_ventas')->insertGetId([
                'numero_venta' => 'VEN-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'fecha_venta' => now()->subDays(5 - $i),
                'cliente_id' => $i,
                'subtotal' => 500.00,
                'descuento' => 0,
                'impuesto' => 60.00,
                'total' => 560.00,
                'estado' => 'completada',
                'usuario_id' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Detalles de venta
            DB::table('oper_ventas_det')->insert([
                'venta_id' => $ventaId,
                'producto_id' => $i,
                'cantidad' => 2,
                'precio_unitario' => 250.00,
                'descuento' => 0,
                'subtotal' => 500.00,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Ventas creadas: 5\n";
    }

    private function seedCompras()
    {
        $count = DB::table('oper_compras')->count();
        if ($count >= 3) {
            echo "ℹ️  Compras ya existen: $count\n";
            return;
        }

        DB::table('oper_compras')->delete();
        DB::table('oper_compras_det')->delete();

        for ($i = 1; $i <= 3; $i++) {
            $compraId = DB::table('oper_compras')->insertGetId([
                'numero_compra' => 'COM-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'fecha_compra' => now()->subDays(10 - $i),
                'proveedor_id' => $i,
                'subtotal' => 300.00,
                'descuento' => 0,
                'impuesto' => 36.00,
                'total' => 336.00,
                'estado' => 'recibida',
                'usuario_id' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::table('oper_compras_det')->insert([
                'compra_id' => $compraId,
                'producto_id' => $i,
                'cantidad' => 10,
                'precio_unitario' => 30.00,
                'descuento' => 0,
                'subtotal' => 300.00,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Compras creadas: 3\n";
    }

    private function seedBodegas()
    {
        $count = DB::table('log_bodegas')->count();
        if ($count >= 2) {
            echo "ℹ️  Bodegas (Logística) ya existen: $count\n";
            return;
        }

        DB::table('log_bodegas')->insert([
            [
                'nombre' => 'Bodega Central',
                'codigo_sucursal' => 'BOD-001',
                'direccion' => 'Zona 10, Guatemala',
                'telefono' => '2333-4444',
                'tipo' => 'bodega_central',
                'activa' => true
            ],
            [
                'nombre' => 'Tienda Principal',
                'codigo_sucursal' => 'TND-001',
                'direccion' => 'Zona 12, Guatemala',
                'telefono' => '2444-5555',
                'tipo' => 'tienda',
                'activa' => true
            ]
        ]);

        echo "✅ Bodegas (Logística) creadas: 2\n";
    }

    private function seedCajas()
    {
        $count = DB::table('tes_cajas')->count();
        if ($count >= 2) {
            echo "ℹ️  Cajas ya existen: $count\n";
            return;
        }

        DB::table('tes_cajas')->delete();
        DB::table('tes_cajas')->insert([
            [
                'codigo' => 'CAJA001',
                'nombre' => 'Caja Principal',
                'descripcion' => 'Caja principal de ventas',
                'activa' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'codigo' => 'CAJA002',
                'nombre' => 'Caja Secundaria',
                'descripcion' => 'Caja secundaria',
                'activa' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        echo "✅ Cajas creadas: 2\n";
    }

    private function seedGastos()
    {
        $count = DB::table('fin_gastos')->count();
        if ($count >= 3) {
            echo "ℹ️  Gastos ya existen: $count\n";
            return;
        }

        // Asegurar categorías de gastos
        if (DB::table('fin_categorias_gastos')->count() == 0) {
            DB::table('fin_categorias_gastos')->insert([
                ['nombre' => 'Servicios', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Mantenimiento', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['nombre' => 'Administrativos', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        DB::table('fin_gastos')->delete();
        for ($i = 1; $i <= 5; $i++) {
            DB::table('fin_gastos')->insert([
                'numero_gasto' => 'GAS-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'fecha' => now()->subDays(15 - $i),
                'categoria_id' => (($i - 1) % 3) + 1,
                'descripcion' => 'Gasto de prueba ' . $i,
                'monto' => 100.00 + ($i * 50),
                'estado' => 'aprobado',
                'usuario_id' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✅ Gastos creados: 5\n";
    }

    private function seedContabilidad()
    {
        if (DB::table('cont_cuentas')->count() > 0) {
            echo "ℹ️  Cuentas contables ya existen. Saltando.\n";
            return;
        }
        
        echo "📊 Poblando Catálogo de Cuentas...\n";

        // 1. Activos
        $this->createCuenta(null, '1', 'ACTIVO', 'activo', 1, false);
        $this->createCuenta(1, '1.1', 'ACTIVO CORRIENTE', 'activo', 2, false);
        $this->createCuenta(2, '1.1.01', 'CAJA Y BANCOS', 'activo', 3, false);
        $this->createCuenta(3, '1.1.01.01', 'Caja General', 'activo', 4, true);
        $this->createCuenta(3, '1.1.01.02', 'Caja Chica', 'activo', 4, true);
        $this->createCuenta(3, '1.1.01.03', 'Bancos Moneda Nacional', 'activo', 4, true);

        $this->createCuenta(2, '1.1.02', 'CUENTAS POR COBRAR', 'activo', 3, false);
        $this->createCuenta(7, '1.1.02.01', 'Clientes Locales', 'activo', 4, true);
        $this->createCuenta(7, '1.1.02.02', 'Deudores Varios', 'activo', 4, true);

        $this->createCuenta(2, '1.1.03', 'INVENTARIOS', 'activo', 3, false);
        $this->createCuenta(10, '1.1.03.01', 'Mercaderías', 'activo', 4, true);

        $this->createCuenta(1, '1.2', 'ACTIVO NO CORRIENTE', 'activo', 2, false);
        $this->createCuenta(12, '1.2.01', 'PROPIEDAD PLANTA Y EQUIPO', 'activo', 3, false);
        $this->createCuenta(13, '1.2.01.01', 'Mobiliario y Equipo', 'activo', 4, true);
        $this->createCuenta(13, '1.2.01.02', 'Equipo de Cómputo', 'activo', 4, true);
        $this->createCuenta(13, '1.2.01.03', 'Vehículos', 'activo', 4, true);

        // 2. Pasivos
        $this->createCuenta(null, '2', 'PASIVO', 'pasivo', 1, false);
        $this->createCuenta(17, '2.1', 'PASIVO CORRIENTE', 'pasivo', 2, false);
        $this->createCuenta(18, '2.1.01', 'CUENTAS POR PAGAR', 'pasivo', 3, false);
        $this->createCuenta(19, '2.1.01.01', 'Proveedores Locales', 'pasivo', 4, true);
        $this->createCuenta(19, '2.1.01.02', 'Acreedores Varios', 'pasivo', 4, true);
        $this->createCuenta(19, '2.1.01.03', 'Impuestos por Pagar (IVA)', 'pasivo', 4, true);

        // 3. Patrimonio
        $this->createCuenta(null, '3', 'PATRIMONIO', 'patrimonio', 1, false);
        $this->createCuenta(23, '3.1', 'CAPITAL CONTABLE', 'patrimonio', 2, false);
        $this->createCuenta(24, '3.1.01', 'Capital Social', 'patrimonio', 3, true);
        $this->createCuenta(24, '3.1.02', 'Resultados Acumulados', 'patrimonio', 3, true);
        $this->createCuenta(24, '3.1.03', 'Resultado del Ejercicio', 'patrimonio', 3, true);

        // 4. Ingresos
        $this->createCuenta(null, '4', 'INGRESOS', 'ingreso', 1, false);
        $this->createCuenta(28, '4.1', 'INGRESOS DE OPERACIÓN', 'ingreso', 2, false);
        $this->createCuenta(29, '4.1.01', 'Ventas de Mercaderías', 'ingreso', 3, true);
        $this->createCuenta(29, '4.1.02', 'Servicios Prestados', 'ingreso', 3, true);

        // 5. Gastos
        $this->createCuenta(null, '5', 'GASTOS', 'gasto', 1, false);
        $this->createCuenta(32, '5.1', 'COSTOS DE VENTAS', 'gasto', 2, false);
        $this->createCuenta(33, '5.1.01', 'Costo de Ventas', 'gasto', 3, true);
        
        $this->createCuenta(32, '5.2', 'GASTOS DE OPERACIÓN', 'gasto', 2, false);
        $this->createCuenta(35, '5.2.01', 'Sueldos y Salarios', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.02', 'Alquileres', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.03', 'Servicios Públicos', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.04', 'Papelería y Útiles', 'gasto', 3, true);

        echo "✅ Cuentas creadas exitosamente\n";
    }

    private function createCuenta($padreId, $codigo, $nombre, $tipo, $nivel, $aceptaMovimiento)
    {
        if (DB::table('cont_cuentas')->where('codigo_cuenta', $codigo)->exists()) {
            return;
        }
        
        $realPadreId = null;
        if ($padreId !== null) {
             $lastDot = strrpos($codigo, '.');
             if ($lastDot !== false) {
                 $codigoPadre = substr($codigo, 0, $lastDot);
                 $padre = DB::table('cont_cuentas')->where('codigo_cuenta', $codigoPadre)->first();
                 if ($padre) {
                     $realPadreId = $padre->id;
                 }
             }
        }

        DB::table('cont_cuentas')->insert([
            'codigo_cuenta' => $codigo,
            'nombre_cuenta' => $nombre,
            'tipo' => $tipo,
            'nivel' => $nivel,
            'cuenta_padre_id' => $realPadreId,
            'es_cuenta_movimiento' => $aceptaMovimiento,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}
