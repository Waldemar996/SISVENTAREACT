<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvCategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categorias = \App\Models\Inventario\InvCategoria::all();

        return response()->json($categorias);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
        ]);

        $categoria = \App\Models\Inventario\InvCategoria::create($validated);

        return response()->json(['message' => 'Categoría creada', 'data' => $categoria], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $categoria = \App\Models\Inventario\InvCategoria::findOrFail($id);

        return response()->json($categoria);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $categoria = \App\Models\Inventario\InvCategoria::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'categoria_padre_id' => 'nullable|exists:inv_categorias,id',
        ]);

        $categoria->update($validated);

        return response()->json(['message' => 'Categoría actualizada', 'data' => $categoria]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $categoria = \App\Models\Inventario\InvCategoria::findOrFail($id);

        // Check for usage
        if ($categoria->productos()->exists()) {
            return response()->json(['error' => 'No se puede eliminar la categoría porque tiene productos asociados'], 400);
        }

        $categoria->delete(); // Hard delete

        return response()->json(['message' => 'Categoría eliminada']);
    }
}
