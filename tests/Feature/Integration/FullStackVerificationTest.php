<?php

namespace Tests\Feature\Integration;

use Tests\TestCase;
use App\Models\User;
use App\Models\Inventario\InvProducto;
use App\Models\System\SysAuditLog;

class FullStackVerificationTest extends TestCase
{
    // Simplified test without complex setups to isolate syntax
    
    /** @test */
    public function system_can_calculate_totals()
    {
        $user = User::first() ?? User::factory()->create();
        
        // Use existing product or create dummy
        $prod = InvProducto::first();
        if (!$prod) {
            $prod = new InvProducto();
            $prod->codigo_sku = 'SETUP_TEST';
            $prod->nombre = 'Test';
            $prod->precio_venta_base = 100;
            $prod->costo_promedio = 50;
            $prod->activo = true;
            $prod->save(); // Force save skipping validation/relations for speed if possible, or assume defaults
        }

        $response = $this->actingAs($user)
                         ->postJson('/api/operaciones/ventas/calcular-totales', [
                             'items' => [['producto_id' => $prod->id, 'cantidad' => 2]]
                         ]);

        $response->assertStatus(200);
        $this->assertEquals(200 + ($response->json('impuestos') ?? 0), $response->json('total'), 'Total calculation mismatch'); // Approximate check
    }

    /** @test */
    public function system_audits_inventory_adjustments()
    {
        $user = User::first() ?? User::factory()->create();
        $prod = InvProducto::firstOrFail();
        $bodega = \App\Models\Inventario\InvBodega::first() ?? \App\Models\Inventario\InvBodega::create(['nombre' => 'Bodega Test']);

        $response = $this->actingAs($user)
                         ->postJson('/api/inventario/ajustes', [
                             'producto_id' => $prod->id,
                             'bodega_id' => $bodega->id,
                             'cantidad' => 1,
                             'tipo_movimiento' => 'ENTRADA',
                             'motivo' => 'INTEGRATION CHECK'
                         ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('sys_audit_logs', [
            'accion' => 'AJUSTE_STOCK',
            'usuario_id' => $user->id
        ]);
    }
}
