<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Config\SysConfiguracion;
use App\Models\RRHH\RrhhDepartamento;
use App\Models\RRHH\RrhhPuesto;
use App\Models\RRHH\RrhhEmpleado;
use App\Models\RRHH\SysUsuario;
use App\Models\Logistica\LogBodega;
use App\Models\Tesoreria\TesCaja;
use App\Models\Inventario\InvUnidad;
use App\Models\Inventario\InvCategoria;
use App\Models\Inventario\InvMarca;
use App\Models\Finanzas\FinCategoriaGasto;

class CoreDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. CONFIGURACIÓN INICIAL
        // (Ya se insertó parcialmente en la migración de triggers, pero aseguramos datos completos aquí)
        $config = SysConfiguracion::first();
        if (!$config) {
            SysConfiguracion::create([
                'nombre_empresa' => 'Mi Gran Empresa S.A.',
                'nit_empresa' => '1234567-8',
                'direccion_fiscal' => 'Ciudad de Guatemala, Guatemala',
                'moneda_simbolo' => 'Q',
                'impuesto_general_iva' => 12.00,
                'email_contacto' => 'admin@empresa.com'
            ]);
        }

        // 2. RRHH BÁSICO
        $depto = RrhhDepartamento::create([
            'nombre' => 'Administración',
            'descripcion' => 'Gerencia General y Administración del Sistema'
        ]);

        $puesto = RrhhPuesto::create([
            'nombre_puesto' => 'Gerente General',
            'departamento_id' => $depto->id,
            'salario_base' => 15000.00
        ]);

        $empleado = RrhhEmpleado::create([
            'codigo_empleado' => 'EMP-001',
            'nombres' => 'Administrador',
            'apellidos' => 'Sistema',
            'dpi_identificacion' => '1000 00000 0101',
            'email_personal' => 'admin@sistema.com',
            'direccion_residencia' => 'Ciudad',
            'puesto_id' => $puesto->id,
            'fecha_contratacion' => now(),
            'estado' => 'activo'
        ]);

        // 3. USUARIO SUPERADMIN
        SysUsuario::create([
            'empleado_id' => $empleado->id,
            'username' => 'admin',
            'email' => 'admin@admin.com',
            'password_hash' => Hash::make('password123'), // Contraseña segura
            'rol' => 'superadmin',
            'activo' => true
        ]);
        
        $this->command->info('Usuario creado: admin / password123');

        // 4. LOGÍSTICA
        $bodega = LogBodega::create([
            'nombre' => 'Bodega Central',
            'codigo_sucursal' => 'BOD-01',
            'direccion' => 'Zona 1, Ciudad',
            'tipo' => 'bodega_central',
            'activa' => true
        ]);

        // 5. TESORERÍA
        TesCaja::create([
            'nombre_caja' => 'Caja General 01',
            'bodega_id' => $bodega->id,
            'estado' => 'disponible' // Sin usuario asignado aún
        ]);

        // 6. INVENTARIO BÁSICO
        InvUnidad::insert([
            ['nombre' => 'Unidad', 'abreviatura' => 'UND'],
            ['nombre' => 'Libra', 'abreviatura' => 'LB'],
            ['nombre' => 'Quintal', 'abreviatura' => 'QQ'],
            ['nombre' => 'Galón', 'abreviatura' => 'GL'],
            ['nombre' => 'Metro', 'abreviatura' => 'MT'],
        ]);

        InvCategoria::create([
            'nombre' => 'General',
            'categoria_padre_id' => null
        ]);

        InvMarca::create([
            'nombre' => 'Genérica',
            'pais' => 'Local'
        ]);

        // 7. COMERCIAL (Clientes y Proveedores Genéricos)
        \App\Models\Comercial\ComCliente::create([
            'razon_social' => 'Cliente Final',
            'nit' => 'CF',
            'direccion' => 'Ciudad',
            'telefono' => '00000000',
            'email' => 'cliente@generico.com',
            'limite_credito' => 0
        ]);

        \App\Models\Comercial\ComProveedor::create([
            'razon_social' => 'Proveedor General',
            'nit' => 'CF',
            'nombre_contacto' => 'Ventas',
            'telefono' => '00000000',
            'email' => 'proveedor@generico.com',
        ]);

        // 8. FINANZAS
        FinCategoriaGasto::insert([
            ['nombre' => 'Servicios Básicos (Luz, Agua)', 'es_deducible' => true],
            ['nombre' => 'Planilla y Salarios', 'es_deducible' => true],
            ['nombre' => 'Mantenimiento Local', 'es_deducible' => true],
            ['nombre' => 'Viáticos y Transporte', 'es_deducible' => true],
            ['nombre' => 'Publicidad', 'es_deducible' => true],
            ['nombre' => 'Otros Gastos', 'es_deducible' => false],
        ]);
    }
}
