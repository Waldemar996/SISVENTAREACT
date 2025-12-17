<?php

namespace Tests\Feature;

use App\Models\Comercial\ComCliente;
use App\Models\Comercial\ComProveedor;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvProducto;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Tests\TestCase;

class StrictBackendTest extends TestCase
{
    protected $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        // Simular Login con Admin
        $this->usuario = SysUsuario::where('username', 'admin')->first();
        if (! $this->usuario) {
            $this->usuario = SysUsuario::create([
                'username' => 'admin',
                'email' => 'admin@test.com',
                'password_hash' => bcrypt('password'),
                'rol' => 'ADMIN',
                'activo' => true,
            ]);
        }

        // Sanctum Mock
        $this->actingAs($this->usuario, 'sanctum');
    }

    /** @test */
    public function flujo_completo_inventario_kardex()
    {
        echo "\n>>> INICIANDO PRUEBA ESTRICTA DE BACKEND <<<\n";

        // 1. PREPARACIÓN
        $bodega = LogBodega::firstOrCreate(
            ['tipo' => 'bodega_central'],
            ['nombre' => 'Bodega Test', 'activa' => true]
        );

        $cliente = ComCliente::firstOrCreate(
            ['nit' => 'CF'],
            ['razon_social' => 'Cliente Test', 'direccion' => 'Ciudad']
        );
        $proveedor = ComProveedor::firstOrCreate(
            ['nit' => 'PROV-TEST'],
            ['razon_social' => 'Proveedor Test']
        );

        // 2. CREAR DEPENDENCIA DE INVENTARIO
        $categoria = \App\Models\Inventario\InvCategoria::firstOrCreate(
            ['nombre' => 'Categoria Test'],
            ['descripcion' => 'Categoria Test', 'activa' => true]
        );
        $marca = \App\Models\Inventario\InvMarca::firstOrCreate(
            ['nombre' => 'Marca Test'],
            ['activa' => true]
        );
        $unidad = \App\Models\Inventario\InvUnidad::firstOrCreate(
            ['nombre' => 'Unidad Test'],
            ['abreviatura' => 'UND', 'activa' => true]
        );
        $impuesto = \App\Models\Finanzas\FinTipoImpuesto::firstOrCreate(
            ['codigo_sat' => 'IVA'],
            ['nombre' => 'IVA General', 'porcentaje' => 12.00]
        );
        $caja = \App\Models\Tesoreria\TesCaja::firstOrCreate(
            ['nombre_caja' => 'Caja Test'],
            ['bodega_id' => $bodega->id, 'estado' => 'disponible']
        );

        // 3. CREAR PRODUCTO NUEVO (Stock 0)
        $sku = 'TEST-'.rand(1000, 9999);
        $productoData = [
            'categoria_id' => $categoria->id,
            'marca_id' => $marca->id,
            'unidad_id' => $unidad->id,
            'impuesto_id' => $impuesto->id,
            'impuesto_porcentaje' => $impuesto->porcentaje,
            'codigo_sku' => $sku,
            'nombre' => 'Producto Test Automatizado',
            'costo_promedio' => 100,
            'precio_venta_base' => 150,
            'stock_minimo' => 5,
            'activo' => true,
        ];

        // Crear directo (Backdoor para agilidad)
        $producto = InvProducto::create($productoData);
        $this->assertNotNull($producto->id, 'El producto se creó correctamente en BD');
        echo "[OK] Producto Creado ID: {$producto->id}\n";

        // Verificar Stock Inicial sea 0 o null (Campo: existencia)
        $stockInicial = InvBodegaProducto::where('bodega_id', $bodega->id)
            ->where('producto_id', $producto->id)->value('existencia');

        $this->assertTrue(! $stockInicial || $stockInicial == 0, 'El stock inicial debe ser 0');

        \Illuminate\Support\Facades\DB::listen(function ($query) {
            if (str_contains($query->sql, 'insert into `inv_kardex`')) {
                dump($query->sql);
                dump($query->bindings);
            }
        });

        // 3. REGISTRAR COMPRA (ENTRADA DE 10)
        $compraData = [
            'bodega_id' => $bodega->id,
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'FACTURA',
            'metodo_pago' => 'contado',
            'estado' => 'COMPLETADO',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 10,
                    'costo_unitario' => 100,
                ],
            ],
        ];

        try {
            $this->withoutExceptionHandling();
            $responseCompra = $this->postJson('/api/operaciones/compras', $compraData);

            if ($responseCompra->status() !== 201) {
                throw new \Exception('Status was '.$responseCompra->status().' Body: '.json_encode($responseCompra->json()));
            }
            $responseCompra->assertStatus(201);
        } catch (\Throwable $e) {
            file_put_contents('debug_error.txt', $e->getMessage()."\n".$e->getTraceAsString());
            throw $e;
        }

        // Validar Stock Post-Compra (Debe ser 10)
        $stockPostCompra = InvBodegaProducto::where('bodega_id', $bodega->id)
            ->where('producto_id', $producto->id)->value('existencia');

        $this->assertEquals(10, $stockPostCompra, 'El stock debió aumentar a 10 después de la compra');
        echo "[OK] Compra procesada. Stock actual: {$stockPostCompra}\n";

        // 4. REGISTRAR VENTA (SALIDA DE 3)
        $ventaData = [
            'cliente_id' => $cliente->id,
            'bodega_id' => $bodega->id,
            'tipo_comprobante' => 'FACTURA',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 3,
                    'precio_unitario' => 200,
                ],
            ],
        ];

        // Check fillable
        $v = new \App\Models\Operaciones\OperVenta;
        file_put_contents('debug_fillable.txt', print_r($v->getFillable(), true));

        try {
            $responseVenta = $this->postJson('/api/operaciones/ventas', $ventaData);
            if ($responseVenta->status() !== 201) {
                throw new \Exception('Status Venta: '.$responseVenta->status().' Body: '.json_encode($responseVenta->json()));
            }
            $responseVenta->assertStatus(201);
        } catch (\Throwable $e) {
            file_put_contents('debug_error_venta.txt', $e->getMessage());
            throw $e;
        }

        // Validar Stock Post-Venta (Debe ser 7)
        $stockPostVenta = InvBodegaProducto::where('bodega_id', $bodega->id)
            ->where('producto_id', $producto->id)->value('existencia');

        echo "[DEBUG] Stock Post Venta Leído: {$stockPostVenta}\n";
        $this->assertEquals(7, $stockPostVenta, "El stock debió bajar a 7 después de vender 3. Actual: {$stockPostVenta}");
        echo "[OK] Venta procesada. Stock actual: {$stockPostVenta}\n";

        // 5. VALIDACIÓN: VENDER SIN STOCK
        // Intentar vender 100
        $ventaFallidaData = [
            'cliente_id' => $cliente->id,
            'bodega_id' => $bodega->id,
            'tipo_comprobante' => 'FACTURA',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 100, // Excesivo
                    'precio_unitario' => 200,
                ],
            ],
        ];

        // Expect 400 Bad Request due to caught exception in Controller
        // $this->withoutExceptionHandling(); // Not needed if controller catches it
        $responseFallida = $this->postJson('/api/operaciones/ventas', $ventaFallidaData);

        if ($responseFallida->status() !== 400) {
            $this->fail('La venta debió fallar con 400. Status: '.$responseFallida->status());
        }
        $responseFallida->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $responseFallida->json('message'));
        echo "[OK] Excepción de Stock (HTTP 400) validada correctamente.\n";

        // 6. AUDITORÍA - SKIPPED IN TEST
        echo "[WARN] Audit check skipped.\n";

        // Cleanup - Skip cleanup to avoid FK issues with history
        // $producto->forceDelete();
    }
}
