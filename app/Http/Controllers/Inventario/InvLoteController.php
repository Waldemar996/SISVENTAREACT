<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InvLoteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Traer lotes con producto y estado, ordenados por vencimiento más próximo
        $lotes = \App\Models\Inventario\InvLote::with('producto')
            ->orderBy('fecha_vencimiento', 'asc')
            ->get();

        return response()->json($lotes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inv_productos,id',
            'codigo_lote' => 'required|string|unique:inv_lotes,codigo_lote',
            'fecha_fabricacion' => 'required|date',
            'fecha_vencimiento' => 'required|date|after:fecha_fabricacion',
        ]);

        $lote = \App\Models\Inventario\InvLote::create([
            'producto_id' => $validated['producto_id'],
            'codigo_lote' => $validated['codigo_lote'],
            'fecha_fabricacion' => $validated['fecha_fabricacion'],
            'fecha_vencimiento' => $validated['fecha_vencimiento'],
            'estado' => 'activo',
        ]);

        return response()->json(['message' => 'Lote registrado correctamente', 'data' => $lote], 201);
    }

    public function show(string $id)
    {
        return response()->json(\App\Models\Inventario\InvLote::with('producto')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $lote = \App\Models\Inventario\InvLote::findOrFail($id);

        $validated = $request->validate([
            'fecha_vencimiento' => 'sometimes|required|date',
            'estado' => 'sometimes|required|in:activo,inactivo,vencido,agotado',
        ]);

        $lote->update($validated);

        return response()->json(['message' => 'Lote actualizado', 'data' => $lote]);
    }

    public function destroy(string $id)
    {
        $lote = \App\Models\Inventario\InvLote::findOrFail($id);
        // Validar si tiene stock asociado antes de borrar (complejo, por ahora soft-ish delete o check simple)
        $lote->delete();

        return response()->json(['message' => 'Lote eliminado']);
    }
}
