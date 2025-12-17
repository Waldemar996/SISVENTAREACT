<?php

namespace Tests\Unit;

use App\Http\Controllers\DashboardController;
use App\Models\Comercial\ComCliente;
use App\Models\Inventario\InvProducto;
use App\Models\Operaciones\OperVenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_dashboard_stats_with_correct_structure()
    {
        // Arrange: Create test data
        $this->createTestData();

        // Act: Call dashboard
        $response = $this->get('/dashboard');

        // Assert: Check response
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard')
            ->has('stats')
            ->has('stats.resumen')
            ->has('stats.graficaVentas')
            ->has('stats.topProductos')
        );
    }

    /** @test */
    public function resumen_financiero_calculates_monthly_sales_correctly()
    {
        // Arrange
        $this->createSalesForCurrentMonth(5000);
        $this->createSalesForLastMonth(3000);

        // Act
        $controller = new DashboardController;
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getResumenFInanciero');
        $method->setAccessible(true);
        $result = $method->invoke($controller);

        // Assert
        $this->assertEquals(5000, $result['ventas_mes']);
        $this->assertEquals(3000, $result['ventas_mes_anterior']);
        $this->assertArrayHasKey('tendencia_ventas', $result);
    }

    /** @test */
    public function sparkline_data_returns_7_days_of_data()
    {
        // Arrange
        $this->createSalesForLast7Days();

        // Act
        $controller = new DashboardController;
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getSparklineData');
        $method->setAccessible(true);
        $result = $method->invoke($controller);

        // Assert
        $this->assertCount(7, $result['ventas']);
        $this->assertCount(7, $result['compras']);
        $this->assertCount(7, $result['margen']);
    }

    /** @test */
    public function productos_criticos_filters_correctly()
    {
        // Arrange: Create products with critical stock
        $this->createProductWithCriticalStock('Producto Crítico', 2, 10);
        $this->createProductWithNormalStock('Producto Normal', 50, 10);

        // Act
        $controller = new DashboardController;
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('getProductosCriticos');
        $method->setAccessible(true);
        $result = $method->invoke($controller);

        // Assert
        $this->assertCount(1, $result);
        $this->assertEquals('Producto Crítico', $result[0]['nombre']);
        $this->assertTrue($result[0]['porcentaje'] < 50);
    }

    /** @test */
    public function calcular_tendencia_returns_correct_percentage()
    {
        // Act
        $controller = new DashboardController;
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('calcularTendencia');
        $method->setAccessible(true);

        // Test increase
        $result = $method->invoke($controller, 150, 100);
        $this->assertEquals(50, $result['porcentaje']);
        $this->assertEquals('up', $result['direccion']);

        // Test decrease
        $result = $method->invoke($controller, 75, 100);
        $this->assertEquals(25, $result['porcentaje']);
        $this->assertEquals('down', $result['direccion']);

        // Test zero previous
        $result = $method->invoke($controller, 100, 0);
        $this->assertEquals(100, $result['porcentaje']);
        $this->assertEquals('up', $result['direccion']);
    }

    // Helper methods
    private function createTestData()
    {
        // Create basic test data
        $cliente = ComCliente::factory()->create();
        OperVenta::factory()->count(3)->create([
            'cliente_id' => $cliente->id,
            'total_venta' => 1000,
            'estado' => 'COMPLETADO',
        ]);
    }

    private function createSalesForCurrentMonth($total)
    {
        $cliente = ComCliente::factory()->create();
        OperVenta::factory()->create([
            'cliente_id' => $cliente->id,
            'fecha_emision' => now(),
            'total_venta' => $total,
            'estado' => 'COMPLETADO',
        ]);
    }

    private function createSalesForLastMonth($total)
    {
        $cliente = ComCliente::factory()->create();
        OperVenta::factory()->create([
            'cliente_id' => $cliente->id,
            'fecha_emision' => now()->subMonth(),
            'total_venta' => $total,
            'estado' => 'COMPLETADO',
        ]);
    }

    private function createSalesForLast7Days()
    {
        $cliente = ComCliente::factory()->create();
        for ($i = 0; $i < 7; $i++) {
            OperVenta::factory()->create([
                'cliente_id' => $cliente->id,
                'fecha_emision' => now()->subDays($i),
                'total_venta' => 100 * ($i + 1),
                'estado' => 'COMPLETADO',
            ]);
        }
    }

    private function createProductWithCriticalStock($nombre, $stockActual, $stockMinimo)
    {
        $producto = InvProducto::factory()->create([
            'nombre' => $nombre,
            'stock_minimo' => $stockMinimo,
        ]);

        // Create stock in bodega
        \DB::table('inv_bodega_producto')->insert([
            'bodega_id' => 1,
            'producto_id' => $producto->id,
            'existencia' => $stockActual,
        ]);
    }

    private function createProductWithNormalStock($nombre, $stockActual, $stockMinimo)
    {
        $producto = InvProducto::factory()->create([
            'nombre' => $nombre,
            'stock_minimo' => $stockMinimo,
        ]);

        \DB::table('inv_bodega_producto')->insert([
            'bodega_id' => 1,
            'producto_id' => $producto->id,
            'existencia' => $stockActual,
        ]);
    }
}
