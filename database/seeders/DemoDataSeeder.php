<?php

namespace Database\Seeders;

use App\Models\Comercial\ComCliente;
use App\Models\Comercial\ComProveedor;
use App\Models\Inventario\InvCategoria;
use App\Models\Inventario\InvMarca;
use App\Models\Inventario\InvProducto;
use App\Models\Inventario\InvUnidad;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\RrhhDepartamento;
use App\Models\RRHH\RrhhEmpleado;
use App\Models\RRHH\RrhhPuesto;
use App\Services\KardexService;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_ES'); // Datos en español
        $kardexService = new KardexService;

        // --- 1. RRHH (Departamentos y Empleados) ---
        $deptoVentas = RrhhDepartamento::firstOrCreate(['nombre' => 'Ventas'], ['descripcion' => 'Departamento Comercial']);
        RrhhDepartamento::firstOrCreate(['nombre' => 'Bodega'], ['descripcion' => 'Logística']);
        RrhhDepartamento::firstOrCreate(['nombre' => 'Contabilidad'], ['descripcion' => 'Finanzas']);

        $puestoVendedor = RrhhPuesto::firstOrCreate(['nombre_puesto' => 'Vendedor', 'departamento_id' => $deptoVentas->id], ['salario_base' => 3500]);

        // Crear 10 Empleados
        for ($i = 0; $i < 10; $i++) {
            RrhhEmpleado::firstOrCreate(
                ['dpi_identificacion' => $faker->unique()->numerify('#############')],
                [
                    'codigo_empleado' => 'EMP-'.$faker->unique()->numberBetween(100, 999),
                    'nombres' => $faker->firstName,
                    'apellidos' => $faker->lastName,
                    'email_personal' => $faker->unique()->safeEmail,
                    'puesto_id' => $puestoVendedor->id,
                    'fecha_contratacion' => $faker->date(),
                    'estado' => 'activo',
                ]
            );
        }

        // --- 2. INVENTARIO (Categorias, Marcas, Unidades) ---
        $unidad = InvUnidad::firstOrCreate(['abreviatura' => 'UND'], ['nombre' => 'Unidad']);

        $categorias = [];
        foreach (['Tecnología', 'Hogar', 'Ropa', 'Juguetes', 'Deportes', 'Alimentos', 'Bebidas', 'Limpieza', 'Mascotas', 'Ferretería'] as $catName) {
            $categorias[] = InvCategoria::firstOrCreate(['nombre' => $catName])->id;
        }

        $marcas = [];
        foreach (['Samsung', 'Apple', 'Sony', 'LG', 'Nike', 'Adidas', 'Nestlé', 'Bic', '3M', 'Toyota'] as $marcaName) {
            $marcas[] = InvMarca::firstOrCreate(['nombre' => $marcaName])->id;
        }

        // Obtener Bodega
        $bodega = LogBodega::where('tipo', 'bodega_central')->first();
        if (! $bodega) {
            $bodega = LogBodega::create([
                'nombre' => 'Bodega Central Demo',
                'direccion' => 'Av. Demo 123',
                'activa' => true,
                'tipo' => 'bodega_central',
            ]);
        }

        // --- 3. PRODUCTOS (15 Productos) ---
        for ($i = 0; $i < 15; $i++) {
            $costo = $faker->randomFloat(2, 10, 500);
            $precio = $costo * 1.40; // 40% margen

            $prod = InvProducto::firstOrCreate(
                ['codigo_sku' => 'SKU-'.$faker->unique()->numberBetween(1000, 9999)],
                [
                    'nombre' => $faker->words(3, true), // Nombre de 3 palabras
                    'unidad_id' => $unidad->id,
                    'categoria_id' => $faker->randomElement($categorias),
                    'marca_id' => $faker->randomElement($marcas),
                    'costo_promedio' => $costo,
                    'precio_venta_base' => $precio,
                    'stock_minimo' => 10,
                    'activo' => true,
                ]
            );

            // Cargar Stock Inicial
            try {
                $kardexService->registrarMovimiento(
                    $bodega->id,
                    $prod->id,
                    'ENTRADA',
                    $faker->numberBetween(20, 100),
                    $costo,
                    'INVENTARIO_INICIAL',
                    'GEN-'.$i
                );
            } catch (\Exception $e) {
            }
        }

        // --- 4. COMERCIAL (Clientes y Proveedores) ---
        // 10 Clientes
        for ($i = 0; $i < 10; $i++) {
            ComCliente::firstOrCreate(
                ['nit' => $faker->unique()->numerify('########')],
                [
                    'razon_social' => $faker->name,
                    'direccion' => $faker->address,
                    'telefono' => $faker->phoneNumber,
                    'email' => $faker->email,
                ]
            );
        }

        // 10 Proveedores
        for ($i = 0; $i < 10; $i++) {
            ComProveedor::firstOrCreate(
                ['nit' => $faker->unique()->numerify('#########')],
                [
                    'razon_social' => $faker->company,
                    'telefono' => $faker->phoneNumber,
                    'email' => $faker->companyEmail,
                    'nombre_contacto' => $faker->name,
                ]
            );
        }
    }
}
