<?php

use App\Models\Operaciones\OperCompra;
use App\Models\Inventario\InvProducto;
use App\Services\KardexService;
use App\Models\Comercial\ComProveedor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

// Mock Auth logic if needed, but we can just use ID in the create calls.
// To satisfy any internal Auth::id() calls if they exist deeply nested (Controller used auth()->id()):
// We are bypassing the controller, so we manually put the ID.
// However, if KardexService used Auth, we'd need it. It doesn't use Auth.

$bodega_id = 1; // POS uses Bodega 1
$proveedor_id = 1; // Needs to be valid
$producto_id = 33;
$cantidad = 50; 
$costo = 40.00;

echo "--- Starting Stock Refill for Product $producto_id to Bodega $bodega_id ---\n";

try {
    DB::transaction(function() use ($bodega_id, $proveedor_id, $producto_id, $cantidad, $costo) {
        
        // 1. Create Header
        $compra = OperCompra::create([
            'proveedor_id' => $proveedor_id,
            'usuario_id' => 1, // Force User 1 (Admin)
            'bodega_id' => $bodega_id,
            'numero_comprobante' => 'C-FIX-' . time(),
            'tipo_comprobante' => 'FACTURA',
            'fecha_emision' => now(),
            'subtotal' => $cantidad * $costo,
            'total_impuestos' => 0,
            'total_compra' => $cantidad * $costo,
            'estado' => 'COMPLETADO'
        ]);

        echo "[SUCCESS] Compra created with ID: " . $compra->id . "\n";

        // 2. Create Details
        $compra->detalles()->create([
            'producto_id' => $producto_id,
            'cantidad' => $cantidad,
            'costo_unitario' => $costo,
            'subtotal' => $cantidad * $costo
        ]);

        echo "[SUCCESS] Detalle de compra added.\n";

        // 3. Kardex Service
        $kardexService = new KardexService();
        $kardexService->registrarMovimiento(
            $bodega_id,
            $producto_id,
            'compra',
            $cantidad,
            $costo,
            'COMPRA STOCK FIX',
            $compra->id
        );

        echo "[SUCCESS] Kardex updated. Stock added.\n";
    });
} catch (\Exception $e) {
    echo "[ERROR] Transaction failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "--- Process Complete ---\n";
