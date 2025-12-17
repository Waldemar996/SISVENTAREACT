<?php

namespace Tests\Feature\Security;

use App\Models\RRHH\SysUsuario;
use Tests\TestCase;

class PermissionSecurityTest extends TestCase
{
    use \Illuminate\Foundation\Testing\DatabaseTransactions;

    /** @test */
    public function cajero_can_create_sale_but_not_annul()
    {
        // 1. Create Cajero
        $cajero = SysUsuario::factory()->create(['rol' => 'cajero']);

        // 2. Try Create Sale (Should 200/201 or Validation Error, but NOT 403)
        // We expect validation error (422) if empty data, or 201 if valid.
        // 403 means Forbidden.

        $response = $this->actingAs($cajero)->postJson('/api/operaciones/ventas', []);

        // Assert NOT 403.
        $this->assertNotEquals(403, $response->getStatusCode(), 'Cajero should have permission to create sale');

        // 3. Try Annul Sale (Should 403)
        // We can pass any ID, middleware runs before controller logic potentially.
        $responseAnnul = $this->actingAs($cajero)->postJson('/api/operaciones/ventas/999/anular');

        $responseAnnul->assertStatus(403);
    }

    /** @test */
    public function admin_can_create_and_annul()
    {
        $admin = SysUsuario::factory()->create(['rol' => 'admin']);

        $responseCreate = $this->actingAs($admin)->postJson('/api/operaciones/ventas', []);
        $this->assertNotEquals(403, $responseCreate->getStatusCode());

        // Annul requires logic but primarily checks middleware first
        // If controller fails due to 404 (ID 999), it means it passed middleware.
        // If 403, it failed middleware.
        $responseAnnul = $this->actingAs($admin)->postJson('/api/operaciones/ventas/999/anular');

        // Assert NOT 403. Be careful if 404 is returned, that is success for Auth.
        $this->assertNotEquals(403, $responseAnnul->getStatusCode());
    }
}
