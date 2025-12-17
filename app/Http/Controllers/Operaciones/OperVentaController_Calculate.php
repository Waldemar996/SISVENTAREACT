<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Inventario\InvProducto;

// ... keeping existing imports
use App\Services\KardexService;
use App\Application\Sales\CreateVentaService;

class OperVentaController extends Controller
{
    // ... existing constructor ...
    protected $createVentaService;
    protected $kardexService; // Ensure this property is defined if used

    public function __construct(
        \App\Services\KardexService $kardexService,
        \App\Application\Sales\CreateVentaService $createVentaService
    ) {
        $this->kardexService = $kardexService;
        $this->createVentaService = $createVentaService;
    }

    // ... existing methods (index, store, show, update, destroy, print, ticket, search) ...

    /**
     * ADDED: Calculate Totals without Persistence.
     */
    public function calculateTotals(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.producto_id' => 'required|exists:inv_productos,id',
            'items.*.cantidad' => 'required|numeric|min:0.1',
        ]);

        $subtotal = 0;
        $impuestos = 0;
        $total = 0;

        foreach ($validated['items'] as $item) {
            $producto = InvProducto::with('impuesto')->find($item['producto_id']);
            if (!$producto) continue;

            $precio = $producto->precio_venta_base;
            $cantidad = $item['cantidad'];
            
            $lineSubtotal = $precio * $cantidad;
            
            // Tax Calculation (Simplified, usually in Domain)
            $taxRate = $producto->impuesto ? ($producto->impuesto->porcentaje / 100) : 0;
            $lineTax = $lineSubtotal * $taxRate;

            $subtotal += $lineSubtotal;
            $impuestos += $lineTax;
        }

        $total = $subtotal + $impuestos;

        return response()->json([
            'subtotal' => round($subtotal, 2),
            'impuestos' => round($impuestos, 2),
            'total' => round($total, 2),
            'currency' => 'GTQ'
        ]);
    }

    // ... Need to merge this carefully using multi_replace_file_content or a careful replace...
}
