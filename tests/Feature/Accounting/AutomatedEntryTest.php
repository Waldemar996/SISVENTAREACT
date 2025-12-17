<?php

namespace Tests\Feature\Accounting;

use App\Application\Sales\CreateVentaDTO;
use App\Application\Sales\CreateVentaService;
use App\Domain\Sales\Events\VentaConfirmed;
use App\Models\Comercial\ComCliente;
use App\Models\Contabilidad\ContPartida;
use App\Models\Inventario\InvProducto;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Illuminate\Foundation\Testing\DatabaseTransactions; // Correct One
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AutomatedEntryTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // Setup Account Data (Mock accounts if DB is empty, or ensure migration seeded them)
        // For this test, we assume they exist or we create them.
        \App\Models\Contabilidad\ContCuenta::firstOrCreate(['codigo_cuenta' => '110101'], ['nombre_cuenta' => 'Caja General', 'tipo' => 'ACTIVO', 'nivel' => 4]);
        \App\Models\Contabilidad\ContCuenta::firstOrCreate(['codigo_cuenta' => '410101'], ['nombre_cuenta' => 'Ventas', 'tipo' => 'INGRESO', 'nivel' => 4]);
        \App\Models\Contabilidad\ContCuenta::firstOrCreate(['codigo_cuenta' => '210301'], ['nombre_cuenta' => 'IVA Por Pagar', 'tipo' => 'PASIVO', 'nivel' => 4]);

        // Ensure Period ID 1 exists
        // Check if ContPeriodo model exists in App\Models\Contabilidad
        // If not, we might need to find where it is. Assuming App\Models\Contabilidad\ContPeriodo based on ContPartida relationship.
        if (class_exists(\App\Models\Contabilidad\ContPeriodo::class)) {
            \App\Models\Contabilidad\ContPeriodo::firstOrCreate(['id' => 1], [
                'codigo' => '2025-01',
                'nombre' => 'Enero 2025',
                'anio' => now()->year,
                'mes' => now()->month,
                'fecha_inicio' => now()->startOfMonth(),
                'fecha_fin' => now()->endOfMonth(),
                'estado' => 'ABIERTO',
            ]);
        }
    }

    /** @test */
    public function it_creates_accounting_entry_on_sale_confirmation()
    {
        // 0. Setup User & Data
        $user = SysUsuario::factory()->create(['rol' => 'admin']);
        $this->actingAs($user);

        // Setup Sale Data
        $bodega = LogBodega::firstOrCreate(['nombre' => 'Bodega Test'], ['activa' => true]);
        $cliente = ComCliente::firstOrCreate(['nit' => 'CF-TEST'], ['razon_social' => 'Cliente Test']);
        $sku = 'ACC-TEST-'.rand(1000, 9999);
        $producto = InvProducto::create([
            'codigo_sku' => $sku,
            'nombre' => 'Producto Acc',
            'precio_venta_base' => 100,
            'controla_stock' => false,
            'categoria_id' => 1, // Ensure required fields
            'marca_id' => 1,
            'unidad_id' => 1,
            'tipo' => 'producto_terminado',
        ]);

        $this->assertFalse($producto->controla_stock, 'Product should not control stock');

        // Create Cash Session to avoid legacy controller errors if bypassing
        // But here we use Service, which relies on DTO. DTO needs sesionCajaId.
        $caja = \App\Models\Tesoreria\TesCaja::firstOrCreate(
            ['nombre_caja' => 'Caja Acc'],
            ['bodega_id' => $bodega->id]
        );
        $sesion = \App\Models\Tesoreria\TesSesionCaja::create([
            'caja_id' => $caja->id,
            'usuario_id' => $user->id,
            'estado' => 'abierta',
            'monto_inicial' => 0,
            'fecha_apertura' => now(),
        ]);

        $data = [
            'cliente_id' => $cliente->id,
            'bodega_id' => $bodega->id,
            'sesion_caja_id' => $sesion->id,
            'metodo_pago' => 'contado',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 112, // 100 + 12 IVA
                ],
            ],
        ];
        $dto = new CreateVentaDTO($data);

        // 1. Spies
        Event::fake([VentaConfirmed::class]);

        // 2. Execute Service (triggers dispatch)
        $service = app(CreateVentaService::class);
        $ventaEntity = $service->execute($dto);

        // 3. Assert Event Dispatched
        Event::assertDispatched(VentaConfirmed::class);

        // 4. Force Listener execution (since we mocked events, the listener won't run automatically unless we use specific assertions or don't mock)
        // If we want to test the listener EFFECT, we shouldn't mock the event, or we should manually call the listener.
        // Let's do a REAL test (no Event::fake) to verify integration.
    }

    /** @test */
    public function it_actually_creates_the_db_records()
    {
        $user = SysUsuario::factory()->create(['rol' => 'admin']);
        $this->actingAs($user);

        // Setup Sale Data
        $bodega = LogBodega::firstOrCreate(['nombre' => 'Bodega Real'], ['activa' => true]);
        $cliente = ComCliente::firstOrCreate(['nit' => 'Real'], ['razon_social' => 'Real']);
        $sku = 'REAL-'.rand(1000, 9999);
        $producto = InvProducto::create([
            'codigo_sku' => $sku,
            'nombre' => 'Real Prod',
            'precio_venta_base' => 100,
            'controla_stock' => false,
            'categoria_id' => 1,
            'marca_id' => 1,
            'unidad_id' => 1,
            'tipo' => 'producto_terminado',
        ]);
        $caja = \App\Models\Tesoreria\TesCaja::firstOrCreate(
            ['nombre_caja' => 'Caja Real'],
            ['bodega_id' => $bodega->id]
        );
        $sesion = \App\Models\Tesoreria\TesSesionCaja::create([
            'caja_id' => $caja->id,
            'usuario_id' => $user->id,
            'estado' => 'abierta',
            'monto_inicial' => 0,
            'fecha_apertura' => now(),
        ]);

        $dto = new CreateVentaDTO([
            'cliente_id' => $cliente->id,
            'bodega_id' => $bodega->id,
            'sesion_caja_id' => $sesion->id,
            'metodo_pago' => 'contado',
            'detalles' => [
                ['producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 112],
            ],
        ]);

        // EXECUTE
        $service = app(CreateVentaService::class);
        $ventaEntity = $service->execute($dto);

        // ASSERT
        // Check Venta Exists
        $this->assertDatabaseHas('oper_ventas', ['id' => $ventaEntity->getId()]);

        $partida = ContPartida::where('origen_id', $ventaEntity->getId())
            ->where('origen_modulo', 'ventas') // Lowercase
            ->first();

        $this->assertNotNull($partida, 'Accounting Entry should be created.');
        $this->assertEquals('mayorizada', $partida->estado);

        // Check Details (Debits = Credits)
        $debits = $partida->detalles->sum('debe');
        $credits = $partida->detalles->sum('haber');

        $this->assertEquals(112, $debits);
        $this->assertEquals(112, $credits);
    }
}
