<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvMarcaController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $marcas = \App\Models\Inventario\InvMarca::all();
        return response()->json($marcas);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inv_marcas',
            'pais' => 'nullable|string|max:50'
        ]);

        $marca = \App\Models\Inventario\InvMarca::create($validated);
        return response()->json(['message' => 'Marca creada', 'data' => $marca], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $marca = \App\Models\Inventario\InvMarca::findOrFail($id);
        return response()->json($marca);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $marca = \App\Models\Inventario\InvMarca::findOrFail($id);
        
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:100|unique:inv_marcas,nombre,' . $id,
            'pais' => 'nullable|string|max:50'
        ]);

        $marca->update($validated);
        return response()->json(['message' => 'Marca actualizada', 'data' => $marca]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $marca = \App\Models\Inventario\InvMarca::findOrFail($id);
        
        // Check usage
        if ($marca->productos()->exists()) {
            return response()->json(['error' => 'No se puede eliminar la marca porque tiene productos asociados'], 400);
        }

        $marca->delete();
        return response()->json(['message' => 'Marca eliminada']);
    }
}
