<?php

namespace Tests\Feature;

use App\Models\Comercial\ComCliente;
use App\Models\Inventario\InvProducto;
use App\Models\Operaciones\OperVenta;
use App\Models\Operaciones\OperVentaDet;
use App\Models\RRHH\SysUsuario;
use App\Models\Tesoreria\TesSesionCaja;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VentaFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function complete_venta_flow_works_correctly()
    {
        // Arrange: Setup test data
        $user = SysUsuario::factory()->create();
        $cliente = ComCliente::factory()->create();
        $producto = InvProducto::factory()->create([
            'precio_venta_base' => 100,
            'stock_minimo' => 5,
        ]);

        // Create stock
        \DB::table('inv_bodega_producto')->insert([
            'bodega_id' => 1,
            'producto_id' => $producto->id,
            'existencia' => 50,
        ]);

        // Create sesion caja
        $sesion = TesSesionCaja::factory()->create([
            'usuario_id' => $user->id,
            'estado' => 'abierta',
        ]);

        // Act: Create venta
        $response = $this->actingAs($user)->postJson('/api/operaciones/ventas', [
            'cliente_id' => $cliente->id,
            'bodega_id' => 1,
            'sesion_caja_id' => $sesion->id,
            'tipo_comprobante' => 'FACTURA',
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100,
                ],
            ],
        ]);

        // Assert: Venta created
        $response->assertStatus(201);
        $this->assertDatabaseHas('oper_ventas', [
            'cliente_id' => $cliente->id,
            'total_venta' => 500,
        ]);

        // Assert: Stock updated
        $this->assertDatabaseHas('inv_bodega_producto', [
            'producto_id' => $producto->id,
            'existencia' => 45, // 50 - 5
        ]);

        // Assert: Kardex entry created
        $this->assertDatabaseHas('inv_kardex', [
            'producto_id' => $producto->id,
            'tipo_movimiento' => 'VENTA',
            'cantidad' => -5,
        ]);
    }

    /** @test */
    public function anular_venta_reverts_stock_correctly()
    {
        // Arrange: Create a completed venta
        $user = SysUsuario::factory()->create();
        $venta = OperVenta::factory()->create([
            'usuario_id' => $user->id,
            'estado' => 'COMPLETADO',
            'total_venta' => 500,
        ]);

        $producto = InvProducto::factory()->create();

        OperVentaDet::factory()->create([
            'venta_id' => $venta->id,
            'producto_id' => $producto->id,
            'cantidad' => 5,
        ]);

        // Set initial stock
        \DB::table('inv_bodega_producto')->insert([
            'bodega_id' => 1,
            'producto_id' => $producto->id,
            'existencia' => 45,
        ]);

        // Act: Anular venta
        $response = $this->actingAs($user)->postJson("/api/operaciones/ventas/{$venta->id}/anular");

        // Assert: Venta anulada
        $response->assertStatus(200);
        $this->assertDatabaseHas('oper_ventas', [
            'id' => $venta->id,
            'estado' => 'ANULADA',
        ]);

        // Assert: Stock reverted
        $this->assertDatabaseHas('inv_bodega_producto', [
            'producto_id' => $producto->id,
            'existencia' => 50, // 45 + 5
        ]);

        // Assert: Reversal kardex entry
        $this->assertDatabaseHas('inv_kardex', [
            'producto_id' => $producto->id,
            'tipo_movimiento' => 'ANULACION_VENTA',
            'cantidad' => 5,
        ]);
    }

    /** @test */
    public function venta_validation_prevents_invalid_data()
    {
        // Arrange
        $user = SysUsuario::factory()->create();

        // Act: Try to create venta without required fields
        $response = $this->actingAs($user)->postJson('/api/operaciones/ventas', [
            // Missing cliente_id, detalles, etc.
        ]);

        // Assert: Validation error
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cliente_id', 'detalles']);
    }

    /** @test */
    public function venta_prevents_negative_stock()
    {
        // Arrange
        $user = SysUsuario::factory()->create();
        $cliente = ComCliente::factory()->create();
        $producto = InvProducto::factory()->create();

        // Only 2 items in stock
        \DB::table('inv_bodega_producto')->insert([
            'bodega_id' => 1,
            'producto_id' => $producto->id,
            'existencia' => 2,
        ]);

        $sesion = TesSesionCaja::factory()->create([
            'usuario_id' => $user->id,
            'estado' => 'abierta',
        ]);

        // Act: Try to sell 5 items
        $response = $this->actingAs($user)->postJson('/api/operaciones/ventas', [
            'cliente_id' => $cliente->id,
            'bodega_id' => 1,
            'sesion_caja_id' => $sesion->id,
            'detalles' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 100,
                ],
            ],
        ]);

        // Assert: Error due to insufficient stock
        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Stock insuficiente']);
    }
}
