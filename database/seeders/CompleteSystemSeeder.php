<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompleteSystemSeeder extends Seeder
{
    /**
     * Seed all modules with test data
     */
    public function run()
    {
        // 1. Impuestos (si la tabla existe)
        $this->seedImpuestos();

        // 2. Series (si la tabla existe)
        $this->seedSeries();

        // 3. Cuentas Contables (si la tabla existe)
        $this->seedCuentasContables();

        // 4. Configuración Empresa
        $this->seedEmpresa();

        echo "✅ Todos los módulos poblados con datos de prueba\n";
    }

    private function seedImpuestos()
    {
        try {
            // Verificar si la tabla existe
            if (! DB::getSchemaBuilder()->hasTable('sys_impuestos')) {
                echo "⚠️ Tabla sys_impuestos no existe, creándola...\n";
                DB::statement("
                    CREATE TABLE IF NOT EXISTS `sys_impuestos` (
                        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                        `codigo` varchar(10) NOT NULL,
                        `nombre` varchar(100) NOT NULL,
                        `tipo` enum('IVA','ISR','Timbre','Retención','Otro') NOT NULL,
                        `porcentaje` decimal(5,2) NOT NULL,
                        `activo` tinyint(1) NOT NULL DEFAULT '1',
                        `descripcion` varchar(300) DEFAULT NULL,
                        `created_at` timestamp NULL DEFAULT NULL,
                        `updated_at` timestamp NULL DEFAULT NULL,
                        PRIMARY KEY (`id`),
                        UNIQUE KEY `codigo` (`codigo`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            }

            // Limpiar datos existentes
            DB::table('sys_impuestos')->truncate();

            // Insertar impuestos
            DB::table('sys_impuestos')->insert([
                [
                    'codigo' => 'IVA',
                    'nombre' => 'IVA 12%',
                    'tipo' => 'IVA',
                    'porcentaje' => 12.00,
                    'activo' => true,
                    'descripcion' => 'Impuesto al Valor Agregado',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'codigo' => 'ISR',
                    'nombre' => 'ISR 5%',
                    'tipo' => 'ISR',
                    'porcentaje' => 5.00,
                    'activo' => true,
                    'descripcion' => 'Impuesto Sobre la Renta',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'codigo' => 'RET',
                    'nombre' => 'Retención IVA',
                    'tipo' => 'Retención',
                    'porcentaje' => 15.00,
                    'activo' => true,
                    'descripcion' => 'Retención de IVA',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            echo "✅ Impuestos creados: 3\n";
        } catch (\Exception $e) {
            echo '❌ Error en impuestos: '.$e->getMessage()."\n";
        }
    }

    private function seedSeries()
    {
        try {
            // Verificar si la tabla existe
            if (! DB::getSchemaBuilder()->hasTable('sys_series')) {
                echo "⚠️ Tabla sys_series no existe, creándola...\n";
                DB::statement("
                    CREATE TABLE IF NOT EXISTS `sys_series` (
                        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                        `tipo_documento` enum('factura','cotizacion','compra','venta','devolucion','traslado','partida','recibo') NOT NULL,
                        `prefijo` varchar(10) NOT NULL,
                        `numero_inicio` int NOT NULL,
                        `numero_fin` int NOT NULL,
                        `numero_actual` int NOT NULL,
                        `longitud` int NOT NULL DEFAULT '4',
                        `activa` tinyint(1) NOT NULL DEFAULT '1',
                        `descripcion` varchar(200) DEFAULT NULL,
                        `created_at` timestamp NULL DEFAULT NULL,
                        `updated_at` timestamp NULL DEFAULT NULL,
                        PRIMARY KEY (`id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            }

            // Limpiar datos existentes
            DB::table('sys_series')->truncate();

            // Insertar series
            DB::table('sys_series')->insert([
                [
                    'tipo_documento' => 'factura',
                    'prefijo' => 'FAC-',
                    'numero_inicio' => 1,
                    'numero_fin' => 9999,
                    'numero_actual' => 1,
                    'longitud' => 4,
                    'activa' => true,
                    'descripcion' => 'Serie para facturas',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'tipo_documento' => 'cotizacion',
                    'prefijo' => 'COT-',
                    'numero_inicio' => 1,
                    'numero_fin' => 9999,
                    'numero_actual' => 1,
                    'longitud' => 4,
                    'activa' => true,
                    'descripcion' => 'Serie para cotizaciones',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'tipo_documento' => 'venta',
                    'prefijo' => 'VEN-',
                    'numero_inicio' => 1,
                    'numero_fin' => 9999,
                    'numero_actual' => 2,
                    'longitud' => 4,
                    'activa' => true,
                    'descripcion' => 'Serie para ventas',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'tipo_documento' => 'compra',
                    'prefijo' => 'COM-',
                    'numero_inicio' => 1,
                    'numero_fin' => 9999,
                    'numero_actual' => 2,
                    'longitud' => 4,
                    'activa' => true,
                    'descripcion' => 'Serie para compras',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'tipo_documento' => 'partida',
                    'prefijo' => 'P-',
                    'numero_inicio' => 1,
                    'numero_fin' => 9999,
                    'numero_actual' => 1,
                    'longitud' => 4,
                    'activa' => true,
                    'descripcion' => 'Serie para partidas contables',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            echo "✅ Series creadas: 5\n";
        } catch (\Exception $e) {
            echo '❌ Error en series: '.$e->getMessage()."\n";
        }
    }

    private function seedCuentasContables()
    {
        try {
            // Verificar si la tabla existe
            if (! DB::getSchemaBuilder()->hasTable('cont_cuentas')) {
                echo "⚠️ Tabla cont_cuentas no existe, creándola...\n";
                DB::statement("
                    CREATE TABLE IF NOT EXISTS `cont_cuentas` (
                        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                        `codigo` varchar(20) NOT NULL,
                        `nombre` varchar(200) NOT NULL,
                        `tipo` enum('activo','pasivo','capital','ingreso','gasto','costos') NOT NULL,
                        `nivel` int NOT NULL,
                        `cuenta_padre_id` bigint unsigned DEFAULT NULL,
                        `acepta_movimiento` tinyint(1) NOT NULL DEFAULT '1',
                        `activa` tinyint(1) NOT NULL DEFAULT '1',
                        `descripcion` varchar(500) DEFAULT NULL,
                        `created_at` timestamp NULL DEFAULT NULL,
                        `updated_at` timestamp NULL DEFAULT NULL,
                        PRIMARY KEY (`id`),
                        UNIQUE KEY `codigo` (`codigo`),
                        KEY `cuenta_padre_id` (`cuenta_padre_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            }

            // Limpiar datos existentes
            DB::table('cont_cuentas')->delete();

            // Insertar cuentas contables
            DB::table('cont_cuentas')->insert([
                // Activos
                ['codigo' => '1', 'nombre' => 'ACTIVO', 'tipo' => 'activo', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '1.1', 'nombre' => 'ACTIVO CORRIENTE', 'tipo' => 'activo', 'nivel' => 2, 'cuenta_padre_id' => 1, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '1.1.01', 'nombre' => 'Caja', 'tipo' => 'activo', 'nivel' => 3, 'cuenta_padre_id' => 2, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '1.1.02', 'nombre' => 'Bancos', 'tipo' => 'activo', 'nivel' => 3, 'cuenta_padre_id' => 2, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '1.1.03', 'nombre' => 'Cuentas por Cobrar', 'tipo' => 'activo', 'nivel' => 3, 'cuenta_padre_id' => 2, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '1.1.04', 'nombre' => 'Inventarios', 'tipo' => 'activo', 'nivel' => 3, 'cuenta_padre_id' => 2, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],

                // Pasivos
                ['codigo' => '2', 'nombre' => 'PASIVO', 'tipo' => 'pasivo', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '2.1', 'nombre' => 'PASIVO CORRIENTE', 'tipo' => 'pasivo', 'nivel' => 2, 'cuenta_padre_id' => 7, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '2.1.01', 'nombre' => 'Cuentas por Pagar', 'tipo' => 'pasivo', 'nivel' => 3, 'cuenta_padre_id' => 8, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '2.1.02', 'nombre' => 'IVA por Pagar', 'tipo' => 'pasivo', 'nivel' => 3, 'cuenta_padre_id' => 8, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],

                // Capital
                ['codigo' => '3', 'nombre' => 'CAPITAL', 'tipo' => 'capital', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '3.1', 'nombre' => 'Capital Social', 'tipo' => 'capital', 'nivel' => 2, 'cuenta_padre_id' => 11, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],

                // Ingresos
                ['codigo' => '4', 'nombre' => 'INGRESOS', 'tipo' => 'ingreso', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '4.1', 'nombre' => 'Ventas', 'tipo' => 'ingreso', 'nivel' => 2, 'cuenta_padre_id' => 13, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],

                // Gastos
                ['codigo' => '5', 'nombre' => 'GASTOS', 'tipo' => 'gasto', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '5.1', 'nombre' => 'Gastos Administrativos', 'tipo' => 'gasto', 'nivel' => 2, 'cuenta_padre_id' => 15, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],

                // Costos
                ['codigo' => '6', 'nombre' => 'COSTOS', 'tipo' => 'costos', 'nivel' => 1, 'cuenta_padre_id' => null, 'acepta_movimiento' => false, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
                ['codigo' => '6.1', 'nombre' => 'Costo de Ventas', 'tipo' => 'costos', 'nivel' => 2, 'cuenta_padre_id' => 17, 'acepta_movimiento' => true, 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);

            echo "✅ Cuentas contables creadas: 18\n";
        } catch (\Exception $e) {
            echo '❌ Error en cuentas contables: '.$e->getMessage()."\n";
        }
    }

    private function seedEmpresa()
    {
        try {
            // Verificar si ya existe configuración
            $existe = DB::table('sys_configuracion')->exists();

            if (! $existe) {
                DB::table('sys_configuracion')->insert([
                    'nombre_empresa' => 'Mi Empresa S.A.',
                    'nit' => '12345678-9',
                    'direccion' => 'Zona 10, Ciudad de Guatemala',
                    'telefono' => '2222-3333',
                    'email' => 'info@miempresa.com',
                    'sitio_web' => 'https://www.miempresa.com',
                    'regimen_tributario' => 'Régimen General',
                    'moneda_base' => 'GTQ',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                echo "✅ Configuración de empresa creada\n";
            } else {
                echo "ℹ️ Configuración de empresa ya existe\n";
            }
        } catch (\Exception $e) {
            echo '❌ Error en empresa: '.$e->getMessage()."\n";
        }
    }
}
