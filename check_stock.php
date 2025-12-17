<?php

use App\Models\Inventario\InvProducto;
use Illuminate\Database\Eloquent\Builder;

echo "Checking stock in Bodega 1...\n";

$missing = InvProducto::whereDoesntHave('bodegaProductos', function (Builder $q) {
    $q->where('bodega_id', 1)->where('existencia', '>', 0);
})->get(['id', 'nombre', 'codigo_sku']);

echo 'Total Products missing in Bodega 1: '.$missing->count()."\n";

if ($missing->count() > 0) {
    echo "First 10 missing products:\n";
    foreach ($missing->take(10) as $prod) {
        echo "- [ID: {$prod->id}] {$prod->nombre} (SKU: {$prod->codigo_sku})\n";
    }
} else {
    echo "All products have stock in Bodega 1.\n";
}
