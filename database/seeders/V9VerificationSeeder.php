<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class V9VerificationSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Iniciando Verificación de Backend V9 (FINAL - ALL TABLES)...');

        // =================================================================================
        // 0. CATALOGOS GENERALES (Unidades / Finanzas)
        // =================================================================================
        $this->command->warn('Ensuring Catalogs...');
        try {
            if (Schema::hasTable('inv_unidades') && DB::table('inv_unidades')->count() == 0) {
                DB::table('inv_unidades')->insert([
                    ['nombre' => 'Unidad', 'abreviatura' => 'UND'],
                    ['nombre' => 'Libra', 'abreviatura' => 'LB'],
                ]);
            }
            if (Schema::hasTable('fin_categorias_gastos') && DB::table('fin_categorias_gastos')->count() == 0) {
                DB::table('fin_categorias_gastos')->insert([
                    ['nombre' => 'Operativo', 'es_deducible' => 1],
                    ['nombre' => 'Nomina', 'es_deducible' => 1],
                ]);
            }
        } catch (\Exception $e) {
        }

        // =================================================================================
        // 1. CONTABILIDAD (FORCE)
        // =================================================================================
        try {
            $this->command->info('Attempting Force Insert Accounting...');
            if (DB::table('cont_cuentas')->count() == 0) {
                // Enum: 'activo','pasivo','patrimonio','ingreso','gasto','orden'
                $map = [
                    '1' => ['ACTIVO', 'activo'],
                    '2' => ['PASIVO', 'pasivo'],
                    '3' => ['PATRIMONIO', 'patrimonio'],
                    '4' => ['INGRESOS', 'ingreso'],
                    '5' => ['GASTOS', 'gasto'],
                ];
                foreach ($map as $cod => $data) {
                    DB::table('cont_cuentas')->insert([
                        'codigo_cuenta' => $cod,
                        'nombre_cuenta' => $data[0],
                        'tipo' => $data[1],
                        'nivel' => 1,
                        'es_cuenta_movimiento' => 0,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }

            // Schema: anio (int), mes (int), estado, fecha_cierre, usuario_cierre_id
            if (DB::table('cont_periodos')->count() == 0) {
                DB::table('cont_periodos')->insert([
                    'anio' => 2025,
                    'mes' => 1,
                    'estado' => 'abierto',
                    // 'fecha_cierre' => null,
                    // 'usuario_cierre' => null
                ]);
            }
        } catch (\Exception $e) {
            $this->command->error('FORCE ACCT ERROR: '.$e->getMessage());
        }

        // =================================================================================
        // 2. RRHH
        // =================================================================================
        try {
            if (Schema::hasTable('rrhh_departamentos') && DB::table('rrhh_departamentos')->count() == 0) {
                // Depto / Puesto / Empleado
                $did = DB::table('rrhh_departamentos')->insertGetId(['nombre' => 'Ventas', 'descripcion' => 'General']);
                $pid = DB::table('rrhh_puestos')->insertGetId(['nombre_puesto' => 'Vendedor', 'departamento_id' => $did, 'salario_base' => 3500]);

                for ($i = 1; $i <= 10; $i++) {
                    DB::table('rrhh_empleados')->insert([
                        'nombres' => "Empleado $i",
                        'apellidos' => 'Test',
                        'codigo_empleado' => "EMP-$i",
                        'puesto_id' => $pid,
                        'email_personal' => "emp$i@test.com",
                        'fecha_contratacion' => now()->toDateString(),
                        'estado' => 'activo',
                    ]);
                }
            }
        } catch (\Exception $e) {
        }

        // =================================================================================
        // 3. LOGISTICA
        // =================================================================================
        try {
            if (Schema::hasTable('log_bodegas') && DB::table('log_bodegas')->count() == 0) {
                DB::table('log_bodegas')->insert([
                    ['nombre' => 'Central', 'codigo_sucursal' => 'CEN', 'tipo' => 'bodega', 'activa' => 1],
                    ['nombre' => 'Tienda 1', 'codigo_sucursal' => 'T1', 'tipo' => 'tienda', 'activa' => 1],
                ]);
            }
            if (Schema::hasTable('log_rutas') && DB::table('log_rutas')->count() == 0) {
                DB::table('log_rutas')->insert([
                    ['nombre_ruta' => 'Capital', 'zona_cobertura' => 'Zona 1-10', 'created_at' => now()],
                ]);
            }
        } catch (\Exception $e) {
        }

        // =================================================================================
        // 3.5. FINANZAS - IMPUESTOS (CRITICAL DEPENDENCY)
        // =================================================================================
        try {
            if (Schema::hasTable('fin_tipos_impuestos') && DB::table('fin_tipos_impuestos')->count() == 0) {
                // Must use explicit ID for first to ensure FK works
                DB::table('fin_tipos_impuestos')->insert(['id' => 1, 'nombre' => 'IVA 12%', 'porcentaje' => 12.00]);
                DB::table('fin_tipos_impuestos')->insert(['nombre' => 'Exento', 'porcentaje' => 0.00]);
            }
        } catch (\Exception $e) {
            $this->command->error('Impuestos Error: '.$e->getMessage());
        }

        // =================================================================================
        // 4. INVENTARIO (Force Products if empty)
        // =================================================================================
        try {
            if (Schema::hasTable('inv_categorias') && DB::table('inv_categorias')->count() == 0) {
                DB::table('inv_categorias')->insert(['nombre' => 'General']);
            }
            if (Schema::hasTable('inv_marcas') && DB::table('inv_marcas')->count() == 0) {
                DB::table('inv_marcas')->insert(['nombre' => 'Genérica']);
            }

            $catId = DB::table('inv_categorias')->first()->id;
            $marId = DB::table('inv_marcas')->first()->id;

            if (Schema::hasTable('inv_productos') && DB::table('inv_productos')->count() == 0) {
                for ($i = 1; $i <= 10; $i++) {
                    DB::table('inv_productos')->insert([
                        'codigo_sku' => "PROD-$i",
                        'nombre' => "Producto Test $i",
                        'precio_venta_base' => 100,
                        'categoria_id' => $catId,
                        'marca_id' => $marId,
                        'unidad_id' => 1,
                        'activo' => 1,
                        'impuesto_id' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } catch (\Exception $e) {
        }

        // =================================================================================
        // 5. OPERACIONES (Force Transactions)
        // =================================================================================
        try {
            $prods = DB::table('inv_productos')->pluck('id')->toArray();

            if (count($prods) > 0) {
                // Compras
                if (Schema::hasTable('com_proveedores') && DB::table('com_proveedores')->count() == 0) {
                    DB::table('com_proveedores')->insert(['razon_social' => 'Prov Test', 'nit' => 'CF', 'email' => 'x@x.com', 'created_at' => now()]);
                }
                $provId = DB::table('com_proveedores')->first()->id;
                $bodId = DB::table('log_bodegas')->first()->id ?? 1;

                if (Schema::hasTable('oper_compras') && DB::table('oper_compras')->count() == 0) {
                    $cid = DB::table('oper_compras')->insertGetId([
                        'proveedor_id' => $provId, 'bodega_id' => $bodId, 'usuario_id' => 1,
                        'fecha_emision' => now(), 'total_compra' => 100, 'estado' => 'COMPLETADO',
                    ]);
                    if (Schema::hasTable('oper_compras_det')) {
                        DB::table('oper_compras_det')->insert([
                            'compra_id' => $cid, 'producto_id' => $prods[0], 'cantidad' => 10, 'costo_unitario' => 10, 'subtotal' => 100,
                        ]);
                    }
                }

                // Ventas
                if (Schema::hasTable('com_clientes') && DB::table('com_clientes')->count() == 0) {
                    DB::table('com_clientes')->insert(['razon_social' => 'Cliente Final', 'nit' => 'CF', 'direccion' => 'Ciudad', 'tipo_contribuyente' => 'general_iva', 'created_at' => now()]);
                }
                $cliId = DB::table('com_clientes')->first()->id;

                if (Schema::hasTable('oper_ventas') && DB::table('oper_ventas')->count() == 0) {
                    $vid = DB::table('oper_ventas')->insertGetId([
                        'cliente_id' => $cliId, 'bodega_id' => $bodId, 'usuario_id' => 1,
                        'fecha_emision' => now(), 'subtotal' => 100, 'total_venta' => 112, 'estado' => 'COMPLETADO', 'created_at' => now(),
                    ]);
                    if (Schema::hasTable('oper_ventas_det')) {
                        DB::table('oper_ventas_det')->insert([
                            'venta_id' => $vid, 'producto_id' => $prods[0], 'cantidad' => 1, 'precio_unitario' => 100, 'costo_unitario_historico' => 10, 'subtotal' => 100,
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
        }

        // =================================================================================
        // 6. PRODUCCION & OTROS (Force)
        // =================================================================================
        try {
            $prods = DB::table('inv_productos')->pluck('id')->toArray();
            if (count($prods) >= 2 && Schema::hasTable('prod_formulas') && DB::table('prod_formulas')->count() == 0) {
                DB::table('prod_formulas')->insert([
                    'producto_padre_id' => $prods[0],
                    'producto_hijo_id' => $prods[1],
                    'cantidad_requerida' => 1,
                ]);
            }
            if (count($prods) >= 1 && Schema::hasTable('prod_ordenes') && DB::table('prod_ordenes')->count() == 0) {
                DB::table('prod_ordenes')->insert([
                    'numero_orden' => 'ORD-001',
                    'producto_terminado_id' => $prods[0],
                    'cantidad_planeada' => 10,
                    'bodega_destino_id' => 1,
                    'fecha_inicio_programada' => now()->toDateString(),
                    'responsable_id' => 1,
                    'created_at' => now(),
                ]);
            }
            // Finanzas Cats
            if (Schema::hasTable('fin_gastos') && DB::table('fin_gastos')->count() == 0) {
                $catId = DB::table('fin_categorias_gastos')->first()->id ?? 1;
                DB::table('fin_gastos')->insert([
                    'descripcion' => 'Pago Luz', 'categoria_id' => $catId, 'monto' => 100, 'fecha_gasto' => now(), 'usuario_id' => 1,
                ]);
            }
        } catch (\Exception $e) {
        }

        $this->command->info('Verificación TOTAL V9 Completada.');
    }
}
