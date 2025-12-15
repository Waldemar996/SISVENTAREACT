<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvSerieController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Inventario\InvSerie::with(['producto', 'bodega']);
        
        if ($request->has('q')) {
            $query->where('numero_serie', 'like', '%' . $request->q . '%');
        }

        return response()->json($query->limit(50)->get()); // Limitar para rendimiento
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inv_productos,id',
            'bodega_id' => 'required|exists:log_bodegas,id',
            'numero_serie' => 'required|string|unique:inv_series,numero_serie',
        ]);

        $serie = \App\Models\Inventario\InvSerie::create([
            'producto_id' => $validated['producto_id'],
            'bodega_id' => $validated['bodega_id'],
            'numero_serie' => $validated['numero_serie'],
            'estado' => 'disponible'
        ]);

        return response()->json(['message' => 'Serie registrada', 'data' => $serie], 201);
    }

    public function show(string $id)
    {
        return response()->json(\App\Models\Inventario\InvSerie::with(['producto', 'compra', 'venta'])->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $serie = \App\Models\Inventario\InvSerie::findOrFail($id);
        $serie->update($request->only('estado')); // Solo estado por ahora
        return response()->json(['message' => 'Estado de serie actualizado']);
    }

    public function destroy(string $id)
    {
        $serie = \App\Models\Inventario\InvSerie::findOrFail($id);
        if ($serie->estado !== 'disponible') {
             return response()->json(['message' => 'No se puede eliminar una serie que ya fue vendida o no está disponible.'], 409);
        }
        $serie->delete();
        return response()->json(['message' => 'Serie eliminada']);
    }
}
