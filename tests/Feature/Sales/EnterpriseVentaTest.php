<?php

namespace Tests\Feature\Sales;

use App\Application\Sales\CreateVentaDTO;
use App\Application\Sales\CreateVentaService;
use App\Models\Comercial\ComCliente;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvProducto;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Tests\TestCase;

class EnterpriseVentaTest extends TestCase
{
    // Use existing DB state or migrations? Project seems to rely on seeding.
    // We'll stick to manual setup like StrictBackendTest.

    protected function setUp(): void
    {
        parent::setUp();
        // Setup similar to StrictBackendTest
        $this->actingAs(SysUsuario::first() ?? SysUsuario::factory()->create());
    }

    /** @test */
    public function it_creates_a_sale_via_enterprise_service()
    {
        // 1. Setup Dependencies
        $bodega = LogBodega::firstOrCreate(['nombre' => 'Bodega Ent'], ['activa' => true, 'tipo' => 'bodega_central']);
        $cliente = ComCliente::firstOrCreate(['nit' => 'CF-ENT'], ['razon_social' => 'Cliente Enterprise', 'direccion' => 'Cloud']);

        // Create Product
        $sku = 'ENT-'.rand(1000, 9999);
        $producto = InvProducto::create([
            'codigo_sku' => $sku,
            'nombre' => 'Producto Enterprise',
            'costo_promedio' => 50,
            'precio_venta_base' => 100,
            'activo' => true,
            'categoria_id' => 1, 'marca_id' => 1, 'unidad_id' => 1, 'impuesto_id' => 1, 'impuesto_porcentaje' => 12,
        ]);

        // Add Initial Stock (Manual input as Purchase logic is separate)
        InvBodegaProducto::updateOrCreate(
            ['bodega_id' => $bodega->id, 'producto_id' => $producto->id],
            ['existencia' => 100]
        );

        // Create Cash Session
        $caja = \App\Models\Tesoreria\TesCaja::firstOrCreate(
            ['nombre_caja' => 'Caja Ent'],
            ['bodega_id' => $bodega->id, 'estado' => 'disponible']
        );
        $sesion = \App\Models\Tesoreria\TesSesionCaja::firstOrCreate(
            ['caja_id' => $caja->id, 'usuario_id' => auth()->id(), 'estado' => 'abierta'],
            ['fecha_apertura' => now(), 'monto_inicial' => 0]
        );

        // 2. Prepare DTO
        $data = [
            'cliente_id' => $cliente->id,
            'bodega_id' => $bodega->id,
            'sesion_caja_id' => $sesion->id,
            'metodo_pago' => 'contado',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100,
                ],
            ],
        ];
        $dto = new CreateVentaDTO($data);

        // 3. Resolve Service
        $service = app(CreateVentaService::class);

        // 4. Execute
        $ventaEntity = $service->execute($dto);

        // 5. Verify Domain/App Response
        $this->assertEquals('COMPLETADO', $ventaEntity->getEstado());
        $this->assertEquals(500, $ventaEntity->getTotal()->getMonto());

        // 6. Verify Database
        $this->assertDatabaseHas('oper_ventas', [
            'cliente_id' => $cliente->id,
            'total_venta' => 500,
        ]);

        // 7. Verify Stock Update (KardexService integration)
        // Stock was 100, sold 5 -> should be 95
        $stock = InvBodegaProducto::where('producto_id', $producto->id)->value('existencia');
        $this->assertEquals(95, $stock, 'Stock should decrease via KardexService');
    }
}
