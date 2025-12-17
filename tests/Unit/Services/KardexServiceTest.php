<?php

namespace Tests\Unit\Services;

use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvKardex;
use App\Models\Inventario\InvProducto;
use App\Models\Logistica\LogBodega;
use App\Services\KardexService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests críticos para KardexService
 *
 * IMPORTANCIA: Este servicio maneja el stock - errores aquí = pérdidas económicas
 */
class KardexServiceTest extends TestCase
{
    use RefreshDatabase;

    private KardexService $kardexService;

    private InvProducto $producto;

    private LogBodega $bodega;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kardexService = new KardexService;

        // Crear bodega de prueba
        $this->bodega = LogBodega::create([
            'nombre' => 'Bodega Test',
            'codigo' => 'BOD-TEST',
            'activo' => true,
        ]);

        // Crear producto de prueba
        $this->producto = InvProducto::create([
            'nombre' => 'Producto Test',
            'codigo_sku' => 'TEST-001',
            'precio_venta_base' => 100.00,
            'costo_promedio' => 50.00,
            'stock_minimo' => 5,
            'activo' => true,
        ]);
    }

    /** @test */
    public function registra_entrada_de_compra_correctamente()
    {
        // Act: Registrar compra de 10 unidades a Q60
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'compra',
            cantidad: 10,
            costoUnitario: 60.00,
            referencia: 'COMPRA',
            referenciaId: 1
        );

        // Assert: Verificar stock
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();

        $this->assertEquals(10, $stock->existencia);

        // Assert: Verificar costo promedio ponderado
        // Costo anterior: 0 (no había stock)
        // Nuevo costo: (0*0 + 10*60) / 10 = 60
        $this->producto->refresh();
        $this->assertEquals(60.00, $this->producto->costo_promedio);

        // Assert: Verificar registro en kardex
        $this->assertDatabaseHas('inv_kardex', [
            'producto_id' => $this->producto->id,
            'bodega_id' => $this->bodega->id,
            'tipo_movimiento' => 'compra',
            'cantidad' => 10,
            'stock_anterior' => 0,
            'stock_nuevo' => 10,
        ]);
    }

    /** @test */
    public function calcula_correctamente_costo_promedio_ponderado()
    {
        // Arrange: Stock inicial de 10 unidades a Q50
        InvBodegaProducto::create([
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'existencia' => 10,
        ]);

        $this->producto->costo_promedio = 50.00;
        $this->producto->save();

        // Act: Comprar 5 unidades más a Q80
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'compra',
            cantidad: 5,
            costoUnitario: 80.00,
            referencia: 'COMPRA',
            referenciaId: 2
        );

        // Assert: Costo promedio = (10*50 + 5*80) / 15 = 60
        $this->producto->refresh();
        $this->assertEquals(60.00, $this->producto->costo_promedio, '', 0.01);

        // Assert: Stock total = 15
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();
        $this->assertEquals(15, $stock->existencia);
    }

    /** @test */
    public function registra_salida_de_venta_correctamente()
    {
        // Arrange: Stock inicial de 20 unidades
        InvBodegaProducto::create([
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'existencia' => 20,
        ]);

        // Act: Vender 5 unidades
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'venta',
            cantidad: 5,
            costoUnitario: 50.00, // Se usa el costo promedio
            referencia: 'VENTA',
            referenciaId: 1
        );

        // Assert: Stock = 15
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();
        $this->assertEquals(15, $stock->existencia);

        // Assert: Costo promedio NO cambia en ventas
        $this->producto->refresh();
        $this->assertEquals(50.00, $this->producto->costo_promedio);
    }

    /** @test */
    public function lanza_excepcion_con_stock_insuficiente()
    {
        // Arrange: Stock de solo 5 unidades
        InvBodegaProducto::create([
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'existencia' => 5,
        ]);

        // Assert: Debe lanzar excepción
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');

        // Act: Intentar vender 10 unidades (más de lo disponible)
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'venta',
            cantidad: 10,
            costoUnitario: 50.00,
            referencia: 'VENTA',
            referenciaId: 1
        );
    }

    /** @test */
    public function lanza_excepcion_con_tipo_movimiento_invalido()
    {
        // Assert: Debe lanzar excepción
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Tipo de movimiento inválido');

        // Act: Tipo de movimiento que no existe
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'tipo_invalido',
            cantidad: 10,
            costoUnitario: 50.00,
            referencia: 'TEST',
            referenciaId: 1
        );
    }

    /** @test */
    public function maneja_correctamente_producto_sin_stock_inicial()
    {
        // Act: Primera compra (producto sin stock previo)
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'compra',
            cantidad: 15,
            costoUnitario: 45.00,
            referencia: 'COMPRA',
            referenciaId: 1
        );

        // Assert: Crea el registro de stock
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();

        $this->assertNotNull($stock);
        $this->assertEquals(15, $stock->existencia);

        // Assert: Establece el costo promedio
        $this->producto->refresh();
        $this->assertEquals(45.00, $this->producto->costo_promedio);
    }

    /** @test */
    public function registra_devolucion_como_entrada()
    {
        // Arrange: Stock inicial de 10
        InvBodegaProducto::create([
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'existencia' => 10,
        ]);

        // Act: Registrar devolución de 3 unidades
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'devolucion',
            cantidad: 3,
            costoUnitario: 50.00,
            referencia: 'DEVOLUCION',
            referenciaId: 1
        );

        // Assert: Stock aumenta
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();
        $this->assertEquals(13, $stock->existencia);
    }

    /** @test */
    public function registra_todos_los_campos_en_kardex()
    {
        // Act
        $this->kardexService->registrarMovimiento(
            bodegaId: $this->bodega->id,
            productoId: $this->producto->id,
            tipoMovimiento: 'compra',
            cantidad: 10,
            costoUnitario: 55.00,
            referencia: 'COMPRA',
            referenciaId: 123
        );

        // Assert: Verifica que todos los campos se guardaron
        $kardex = InvKardex::where('producto_id', $this->producto->id)->first();

        $this->assertNotNull($kardex);
        $this->assertEquals($this->bodega->id, $kardex->bodega_id);
        $this->assertEquals($this->producto->id, $kardex->producto_id);
        $this->assertEquals('compra', $kardex->tipo_movimiento);
        $this->assertEquals(10, $kardex->cantidad);
        $this->assertEquals(55.00, $kardex->costo_unitario);
        $this->assertEquals(550.00, $kardex->costo_total);
        $this->assertEquals(0, $kardex->stock_anterior);
        $this->assertEquals(10, $kardex->stock_nuevo);
        $this->assertEquals('COMPRA', $kardex->referencia_tipo);
        $this->assertEquals(123, $kardex->referencia_id);
        $this->assertNotNull($kardex->fecha);
        $this->assertNotNull($kardex->glosa);
    }
}
