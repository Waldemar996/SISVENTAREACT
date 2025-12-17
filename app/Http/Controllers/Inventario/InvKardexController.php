<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Inventario\InvKardex;
use Illuminate\Http\Request;

class InvKardexController extends Controller
{
    /**
     * Consultar Kardex de un producto específico o general.
     */
    public function consultar(Request $request)
    {
        $request->validate([
            'producto_id' => 'nullable|exists:inv_productos,id',
            'bodega_id' => 'nullable|exists:log_bodegas,id',
        ]);

        $query = InvKardex::with(['bodega', 'producto'])
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc');

        if ($request->producto_id) {
            $query->where('producto_id', $request->producto_id);
        }

        if ($request->bodega_id) {
            $query->where('bodega_id', $request->bodega_id);
        }

        $movimientos = $query->paginate(20);

        return response()->json([
            'producto' => $request->producto_id ? \App\Models\Inventario\InvProducto::find($request->producto_id) : null,
            'movimientos' => $movimientos,
        ]);
    }
}
