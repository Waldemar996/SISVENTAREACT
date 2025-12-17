<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class V9Seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Default Company Configuration
        // Schema: nombre_empresa, nit_empresa, direccion_fiscal, moneda_simbolo, impuesto_general_iva, actualizado_en
        DB::table('sys_configuracion')->insert([
            'nombre_empresa' => 'Mi Empresa V9 S.A.',
            'nit_empresa' => '1234567-8',
            'direccion_fiscal' => 'Ciudad de Guatemala',
            'moneda_simbolo' => 'Q',
            'impuesto_general_iva' => 12.00,
            // 'actualizado_en' handles itself via DB default
        ]);

        // 2. Create Departments and Roles (RRHH)
        $deptoId = DB::table('rrhh_departamentos')->insertGetId([
            'nombre' => 'Administración',
            'descripcion' => 'Gerencia General y Administrativa',
        ]);

        $puestoId = DB::table('rrhh_puestos')->insertGetId([
            'nombre_puesto' => 'Gerente General',
            'departamento_id' => $deptoId,
            'salario_base' => 15000.00,
        ]);

        // 3. Create Employee
        $empId = DB::table('rrhh_empleados')->insertGetId([
            'nombres' => 'Administrador',
            'apellidos' => 'Sistema',
            'codigo_empleado' => 'EMP-001',
            'email_personal' => 'admin@sistema.com',
            'puesto_id' => $puestoId,
            'fecha_contratacion' => now(),
            'estado' => 'activo',
        ]);

        // 4. Create System User (Linked to Employee)
        // Schema: sys_usuarios HAS created_at, updated_at
        DB::table('sys_usuarios')->insert([
            'empleado_id' => $empId,
            'username' => 'admin',
            'email' => 'admin@sistema.com',
            'password_hash' => Hash::make('password'),
            'rol' => 'superadmin',
            'activo' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Create Default Warehouse
        $bodegaId = DB::table('log_bodegas')->insertGetId([
            'nombre' => 'Bodega Central',
            'codigo_sucursal' => 'SUC-01',
            'tipo' => 'bodega_central',
            'activa' => 1,
        ]);

        // 6. Create Cash Box (Caja)
        DB::table('tes_cajas')->insert([
            'nombre_caja' => 'Caja General 1',
            'bodega_id' => $bodegaId,
            'estado' => 'disponible',
        ]);

        // 7. Create Taxes
        DB::table('fin_tipos_impuestos')->insert([
            ['nombre' => 'IVA General', 'porcentaje' => 12.00, 'codigo_sat' => 'IVA'],
            ['nombre' => 'Exento', 'porcentaje' => 0.00, 'codigo_sat' => 'EXE'],
        ]);

        // 8. Create Units
        DB::table('inv_unidades')->insert([
            ['nombre' => 'Unidad', 'abreviatura' => 'UND'],
            ['nombre' => 'Libra', 'abreviatura' => 'LB'],
            ['nombre' => 'Caja', 'abreviatura' => 'CAJA'],
        ]);

        // 9. Create Categories
        DB::table('inv_categorias')->insert([
            ['nombre' => 'General', 'categoria_padre_id' => null],
        ]);
    }
}
