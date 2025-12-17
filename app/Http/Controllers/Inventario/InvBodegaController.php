<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvBodegaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $bodegas = \App\Models\Logistica\LogBodega::withCount('productos')->where('activa', true)->get();

        return response()->json($bodegas);
    }

    /**
     * Store a newly created resource in storage.
     */
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'codigo_sucursal' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'tipo' => 'required|in:tienda,bodega_central,produccion,virtual',
            'activa' => 'boolean',
        ]);

        $bodega = \App\Models\Logistica\LogBodega::create($validated);

        return response()->json(['message' => 'Bodega creada', 'data' => $bodega], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $bodega = \App\Models\Logistica\LogBodega::findOrFail($id);

        return response()->json($bodega);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $bodega = \App\Models\Logistica\LogBodega::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'codigo_sucursal' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'tipo' => 'sometimes|required|in:tienda,bodega_central,produccion,virtual',
            'activa' => 'boolean',
        ]);

        $bodega->update($validated);

        return response()->json(['message' => 'Bodega actualizada', 'data' => $bodega]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $bodega = \App\Models\Logistica\LogBodega::findOrFail($id);
        $bodega->update(['activa' => false]);

        return response()->json(['message' => 'Bodega desactivada']);
    }
}
