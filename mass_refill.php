<?php

use App\Models\Operaciones\OperCompra;
use App\Models\Inventario\InvProducto;
use App\Services\KardexService;
use App\Models\Comercial\ComProveedor;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;

$bodega_id = 1; // POS target
$proveedor_id = 1; 
$cantidad_por_producto = 100;

echo "--- Starting MASS Stock Refill for Bodega $bodega_id ---\n";

try {
    DB::transaction(function() use ($bodega_id, $proveedor_id, $cantidad_por_producto) {
        
        // Find products with 0 stock in Bodega 1
        $products = InvProducto::whereDoesntHave('bodegaProductos', function(Builder $q) use ($bodega_id) { 
            $q->where('bodega_id', $bodega_id)->where('existencia', '>', 0); 
        })->get();

        if ($products->isEmpty()) {
            echo "No products need refilling.\n";
            return;
        }

        echo "Found " . $products->count() . " products to refill.\n";

        $total_compra = 0;
        foreach($products as $prod) {
            $costo = $prod->costo_promedio > 0 ? $prod->costo_promedio : 10.00; // Default cost if 0
            $total_compra += ($cantidad_por_producto * $costo);
        }

        // 1. Create Header
        $compra = OperCompra::create([
            'proveedor_id' => $proveedor_id,
            'usuario_id' => 1,
            'bodega_id' => $bodega_id,
            'numero_comprobante' => 'C-INIT-' . time(),
            'tipo_comprobante' => 'FACTURA',
            'fecha_emision' => now(),
            'subtotal' => $total_compra,
            'total_impuestos' => 0,
            'total_compra' => $total_compra,
            'estado' => 'COMPLETADO'
        ]);

        echo "[SUCCESS] Main Compra created with ID: " . $compra->id . "\n";

        $kardexService = new KardexService();

        // 2. Loop Details
        foreach($products as $prod) {
            $costo = $prod->costo_promedio > 0 ? $prod->costo_promedio : 10.00;

            // Detail
            $compra->detalles()->create([
                'producto_id' => $prod->id,
                'cantidad' => $cantidad_por_producto,
                'costo_unitario' => $costo,
                'subtotal' => $cantidad_por_producto * $costo
            ]);

            // Kardex
            $kardexService->registrarMovimiento(
                $bodega_id,
                $prod->id,
                'compra',
                $cantidad_por_producto,
                $costo,
                'INICIALIZACION SISTEMA',
                $compra->id
            );
            
            echo "."; // Progress dot
        }

        echo "\n[SUCCESS] All items processed.\n";
    });
} catch (\Exception $e) {
    echo "\n[ERROR] Transaction failed: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
    exit(1);
}

echo "--- Process Complete ---\n";
