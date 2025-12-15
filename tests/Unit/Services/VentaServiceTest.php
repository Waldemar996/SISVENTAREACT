<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\Ventas\VentaService;
use App\Services\KardexService;
use App\Services\AuditService;
use App\DTOs\Ventas\CrearVentaDTO;
use App\Models\Operaciones\OperVenta;
use App\Models\Inventario\InvProducto;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Comercial\ComCliente;
use App\Models\Logistica\LogBodega;
use App\Models\Sistema\SysUsuario;
use App\Models\Tesoreria\TesSesionCaja;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Exception;

/**
 * Tests para VentaService
 * 
 * IMPORTANCIA: Este service maneja ventas - errores = pérdidas económicas
 */
class VentaServiceTest extends TestCase
{
    use RefreshDatabase;

    private VentaService $ventaService;
    private InvProducto $producto;
    private ComCliente $cliente;
    private LogBodega $bodega;
    private SysUsuario $usuario;
    private TesSesionCaja $sesionCaja;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Crear servicios
        $kardexService = new KardexService();
        $auditService = $this->createMock(AuditService::class);
        $this->ventaService = new VentaService($kardexService, $auditService);
        
        // Crear datos de prueba
        $this->bodega = LogBodega::create([
            'nombre' => 'Bodega Test',
            'codigo' => 'BOD-TEST',
            'activo' => true
        ]);
        
        $this->cliente = ComCliente::create([
            'razon_social' => 'Cliente Test',
            'nit' => 'CF',
            'activo' => true
        ]);
        
        $this->usuario = SysUsuario::create([
            'username' => 'testuser',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'rol' => 'vendedor',
            'activo' => true
        ]);
        
        $this->producto = InvProducto::create([
            'nombre' => 'Producto Test',
            'codigo_sku' => 'TEST-001',
            'precio_venta_base' => 100.00,
            'costo_promedio' => 50.00,
            'stock_minimo' => 5,
            'activo' => true
        ]);
        
        // Crear stock inicial
        InvBodegaProducto::create([
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'existencia' => 100
        ]);
        
        // Crear sesión de caja
        $this->sesionCaja = TesSesionCaja::create([
            'usuario_id' => $this->usuario->id,
            'fecha_apertura' => now(),
            'monto_apertura' => 100.00,
            'estado' => 'ABIERTA'
        ]);
    }

    /** @test */
    public function crea_venta_correctamente()
    {
        // Arrange
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100.00,
                    'descuento' => 0,
                    'impuesto' => 12,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id
        );

        // Act
        $venta = $this->ventaService->crear($dto);

        // Assert
        $this->assertInstanceOf(OperVenta::class, $venta);
        $this->assertEquals($this->cliente->id, $venta->cliente_id);
        $this->assertEquals('COMPLETADO', $venta->estado);
        $this->assertEquals(560.00, $venta->total_venta); // 500 + 12% IVA = 560
        
        // Verificar que se creó el detalle
        $this->assertCount(1, $venta->detalles);
        
        // Verificar que se redujo el stock
        $stock = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->first();
        $this->assertEquals(95, $stock->existencia); // 100 - 5 = 95
    }

    /** @test */
    public function calcula_totales_correctamente_con_descuento()
    {
        // Arrange
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 10,
                    'precio_unitario' => 100.00,
                    'descuento' => 10, // 10% descuento
                    'impuesto' => 12,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id,
            descuentoGlobal: 5 // 5% descuento adicional
        );

        // Act
        $venta = $this->ventaService->crear($dto);

        // Assert
        // Subtotal: 10 * 100 = 1000
        // Descuento item: 1000 * 10% = 100 -> Base: 900
        // Descuento global: 900 * 5% = 45 -> Base: 855
        // Impuesto: 855 * 12% = 102.6
        // Total: 855 + 102.6 = 957.6
        $this->assertEquals(957.60, $venta->total_venta, '', 0.01);
    }

    /** @test */
    public function lanza_excepcion_si_no_hay_caja_abierta()
    {
        // Arrange: Cerrar la caja
        $this->sesionCaja->estado = 'CERRADA';
        $this->sesionCaja->save();

        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100.00,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: null // Sin sesión
        );

        // Assert
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('No hay una sesión de caja abierta');

        // Act
        $this->ventaService->crear($dto);
    }

    /** @test */
    public function lanza_excepcion_con_stock_insuficiente()
    {
        // Arrange
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 150, // Más de lo disponible (100)
                    'precio_unitario' => 100.00,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id
        );

        // Assert
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');

        // Act
        $this->ventaService->crear($dto);
    }

    /** @test */
    public function anula_venta_correctamente()
    {
        // Arrange: Crear una venta primero
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 10,
                    'precio_unitario' => 100.00,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id
        );

        $venta = $this->ventaService->crear($dto);
        
        // Verificar stock después de venta
        $stockDespuesVenta = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->value('existencia');
        $this->assertEquals(90, $stockDespuesVenta); // 100 - 10

        // Act: Anular la venta
        $ventaAnulada = $this->ventaService->anular($venta->id, 'Venta de prueba');

        // Assert
        $this->assertEquals('ANULADO', $ventaAnulada->estado);
        $this->assertNotNull($ventaAnulada->fecha_anulacion);
        $this->assertEquals('Venta de prueba', $ventaAnulada->motivo_anulacion);
        
        // Verificar que se revirtió el stock
        $stockDespuesAnulacion = InvBodegaProducto::where('bodega_id', $this->bodega->id)
            ->where('producto_id', $this->producto->id)
            ->value('existencia');
        $this->assertEquals(100, $stockDespuesAnulacion); // Vuelve a 100
    }

    /** @test */
    public function no_permite_anular_venta_ya_anulada()
    {
        // Arrange
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null,
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100.00,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id
        );

        $venta = $this->ventaService->crear($dto);
        $this->ventaService->anular($venta->id);

        // Assert
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('La venta ya está anulada');

        // Act: Intentar anular de nuevo
        $this->ventaService->anular($venta->id);
    }

    /** @test */
    public function genera_numero_comprobante_automaticamente()
    {
        // Arrange
        $dto = new CrearVentaDTO(
            clienteId: $this->cliente->id,
            bodegaId: $this->bodega->id,
            tipoComprobante: 'FACTURA',
            numeroComprobante: null, // Sin número
            serieComprobante: null,
            formaPago: 'EFECTIVO',
            detalles: [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100.00,
                    'costo_unitario' => 50.00
                ]
            ],
            usuarioId: $this->usuario->id,
            sesionCajaId: $this->sesionCaja->id
        );

        // Act
        $venta = $this->ventaService->crear($dto);

        // Assert
        $this->assertNotNull($venta->numero_comprobante);
        $this->assertStringStartsWith('F-', $venta->numero_comprobante);
        $this->assertStringContainsString((string)now()->year, $venta->numero_comprobante);
    }
}
