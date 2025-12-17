<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AIDataSeeder extends Seeder
{
    public function run()
    {
        // Vamos a simular ventas para el primer producto encontrado o crearlo
        $product = DB::table('inv_productos')->first();

        $bodega = DB::table('log_bodegas')->first();
        if (! $bodega) {
            $bodegaId = DB::table('log_bodegas')->insertGetId([
                'nombre' => 'Bodega AI',
                'codigo_sucursal' => 'BAI',
                'direccion' => 'Cloud',
                'tipo' => 'bodega_central',
                'activa' => 1,
            ]);
            $bodega = DB::table('log_bodegas')->where('id', $bodegaId)->first();
        }

        if (! $product) {
            $unidad = DB::table('inv_unidades')->first();
            $categoria = DB::table('inv_categorias')->first();
            $marca = DB::table('inv_marcas')->first();

            // Si faltan dependencias, crearlas también (seguridad)
            if (! $unidad) {
                $unidad = (object) ['id' => DB::table('inv_unidades')->insertGetId(['nombre' => 'U', 'abreviatura' => 'u'])];
            }
            if (! $categoria) {
                $categoria = (object) ['id' => DB::table('inv_categorias')->insertGetId(['nombre' => 'Gen', 'categoria_padre_id' => null])];
            }
            if (! $marca) {
                $marca = (object) ['id' => DB::table('inv_marcas')->insertGetId(['nombre' => 'Gen', 'pais' => 'GTM'])];
            }

            $this->command->info("Unidad ID: {$unidad->id}, Cat ID: {$categoria->id}, Marca ID: {$marca->id}");

            $impuesto = DB::table('fin_tipos_impuestos')->first();
            if (! $impuesto) {
                $impuesto = (object) ['id' => DB::table('fin_tipos_impuestos')->insertGetId([
                    'nombre' => 'IVA General',
                    'porcentaje' => 12.00,
                    'codigo_sat' => 'IVA',
                ])];
            }

            try {
                $productId = DB::table('inv_productos')->insertGetId([
                    'nombre' => 'Producto AI Test',
                    'codigo_sku' => 'AI-1000',
                    'tipo' => 'producto_terminado',
                    'descripcion_corta' => 'Producto para pruebas de IA',
                    'costo_promedio' => 50,
                    'precio_venta_base' => 100,
                    'stock_minimo' => 10,
                    'stock_maximo' => 100,
                    'unidad_id' => $unidad->id,
                    'categoria_id' => $categoria->id,
                    'marca_id' => $marca->id,
                    'impuesto_id' => $impuesto->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $e) {
                $this->command->error('Error creating product: '.$e->getMessage());
                throw $e;
            }
            $product = DB::table('inv_productos')->where('id', $productId)->first();
        }

        $cliente = DB::table('com_clientes')->first();
        if (! $cliente) {
            $cliId = DB::table('com_clientes')->insertGetId(['razon_social' => 'Cli', 'nit' => '1', 'vendedor_asignado_id' => null]);
            $cliente = DB::table('com_clientes')->where('id', $cliId)->first();
        }

        $usuario = DB::table('sys_usuarios')->first();
        if (! $usuario) {
            // Fallback to null if no user, usually nullable in reports but required in schema?
            // Seeder usually has admin.
        }

        // Patrón de tendencia ALCISTA (10 -> 20 -> 30)
        // La predicción debería ser ~40
        $history = [
            ['months_ago' => 3, 'qty' => 10],
            ['months_ago' => 2, 'qty' => 20],
            ['months_ago' => 1, 'qty' => 30],
        ];

        foreach ($history as $h) {
            $date = Carbon::now()->subMonths($h['months_ago']);

            // Insertar Venta Header
            $ventaId = DB::table('oper_ventas')->insertGetId([
                'tipo_comprobante' => 'ticket',
                'cliente_id' => $cliente->id,
                'bodega_id' => $bodega->id,
                'usuario_id' => $usuario->id,
                'fecha_emision' => $date,
                'total_venta' => $h['qty'] * 100,
                'subtotal' => ($h['qty'] * 100) / 1.12, // Subtotal aprox sin IVA
                'total_impuestos' => ($h['qty'] * 100) - (($h['qty'] * 100) / 1.12),
                'descuento' => 0,
                'estado' => 'completada',
                'forma_pago' => 'efectivo',
                'numero_comprobante' => 'AI-TEST-'.$h['months_ago'].'-'.time(),
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            // Insertar Detalle
            DB::table('oper_ventas_det')->insert([
                'venta_id' => $ventaId,
                'producto_id' => $product->id,
                'cantidad' => $h['qty'],
                'precio_unitario' => 100,
                'costo_unitario_historico' => 50, // Costo promedio al momento de venta
                'impuesto_aplicado' => ($h['qty'] * 100) - (($h['qty'] * 100) / 1.12),
                'subtotal' => $h['qty'] * 100,
            ]);
        }

        $this->command->info("✅ Generated AI Training Data for Product: {$product->nombre}");
        $this->command->info('Pattern: 10 -> 20 -> 30 (Linear Upward Trend)');
    }
}
