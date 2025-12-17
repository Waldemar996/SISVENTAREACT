<?php

namespace App\Http\Controllers\Tesoreria;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TesCajaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Listar cajas con su bodega. Si está ocupada, mostrar quién.
        $cajas = \App\Models\Tesoreria\TesCaja::with(['bodega', 'usuarioAsignado'])->get();

        return response()->json($cajas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_caja' => 'required|string|max:50',
            'bodega_id' => 'required|exists:log_bodegas,id',
        ]);

        $caja = \App\Models\Tesoreria\TesCaja::create([
            'nombre_caja' => $validated['nombre_caja'],
            'bodega_id' => $validated['bodega_id'],
            'estado' => 'disponible',
        ]);

        return response()->json(['message' => 'Caja creada exitosamente', 'data' => $caja], 201);
    }

    public function show(string $id)
    {
        $caja = \App\Models\Tesoreria\TesCaja::with(['bodega', 'usuarioAsignado'])->findOrFail($id);

        return response()->json($caja);
    }

    public function update(Request $request, string $id)
    {
        $caja = \App\Models\Tesoreria\TesCaja::findOrFail($id);

        // Bloquear edición si la caja está ocupada (seguridad avanzada)
        if ($caja->estado === 'ocupada') {
            return response()->json(['message' => 'No se puede editar una caja que está actualmente en uso por un cajero.'], 409);
        }

        $validated = $request->validate([
            'nombre_caja' => 'sometimes|required|string|max:50',
            'bodega_id' => 'sometimes|required|exists:log_bodegas,id',
        ]);

        $caja->update($validated);

        return response()->json(['message' => 'Caja actualizada', 'data' => $caja]);
    }

    public function destroy(string $id)
    {
        $caja = \App\Models\Tesoreria\TesCaja::findOrFail($id);

        if ($caja->estado === 'ocupada') {
            return response()->json(['message' => 'No se puede eliminar una caja con sesión abierta.'], 409);
        }

        // Verificar historial de uso antes de borrar
        if (\App\Models\Tesoreria\TesSesionCaja::where('caja_id', $id)->exists()) {
            return response()->json(['message' => 'No se puede eliminar la caja porque tiene historial de sesiones. Desactívala en su lugar.'], 409);
        }

        $caja->delete();

        return response()->json(['message' => 'Caja eliminada correctamente']);
    }
}
