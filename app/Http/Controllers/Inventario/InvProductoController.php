<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvProductoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Inventario\InvProducto::with(['categoria', 'marca', 'unidad', 'bodegaProductos'])
            ->where('activo', true);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('codigo_sku', 'like', "%{$search}%");
            });
        }

        if ($request->has('all')) {
            return response()->json($query->orderBy('nombre', 'asc')->get());
        }

        $productos = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json($productos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => 'required|exists:inv_categorias,id',
            'marca_id' => 'required|exists:inv_marcas,id',
            'unidad_id' => 'required|exists:inv_unidades,id',
            'codigo_sku' => 'required|string|unique:inv_productos,codigo_sku',
            'nombre' => 'required|string|max:200',
            'costo_promedio' => 'numeric|min:0',
            'precio_venta_base' => 'required|numeric|min:0',
            'stock_minimo' => 'integer|min:0',
        ]);

        $producto = \App\Models\Inventario\InvProducto::create($validated);

        return response()->json(['message' => 'Producto creado', 'data' => $producto], 201);
    }

    public function show(string $id)
    {
        $producto = \App\Models\Inventario\InvProducto::with(['categoria', 'marca', 'unidad'])->findOrFail($id);

        return response()->json($producto);
    }

    public function update(Request $request, string $id)
    {
        $producto = \App\Models\Inventario\InvProducto::findOrFail($id);

        $validated = $request->validate([
            'categoria_id' => 'sometimes|exists:inv_categorias,id',
            'marca_id' => 'sometimes|exists:inv_marcas,id',
            'unidad_id' => 'sometimes|exists:inv_unidades,id',
            'codigo_sku' => 'sometimes|required|string|unique:inv_productos,codigo_sku,'.$id,
            'nombre' => 'sometimes|required|string|max:200',
            'precio_venta_base' => 'sometimes|numeric|min:0',
            'activo' => 'boolean',
        ]);

        $producto->update($validated);

        return response()->json(['message' => 'Producto actualizado', 'data' => $producto]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $producto = \App\Models\Inventario\InvProducto::findOrFail($id);
        $producto->delete(); // Soft delete (sets deleted_at)

        return response()->json(['message' => 'Producto eliminado correctamente (baja lógica)']);
    }
}
