<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvUnidadController extends Controller
{
    public function index()
    {
        try {
            // Check if activo column exists dynamically or just return all
            // Based on previous checks, safest is to get all for now, or check schema
            // But strict implementation suggests checking model.
            // Let's assume standard behavior but be robust.
            $unidades = DB::table('inv_unidades')->orderBy('nombre')->get();

            return response()->json($unidades);
        } catch (\Exception $e) {
            Log::error('Error en Unidades index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar unidades'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'abreviatura' => 'required|string|max:10|unique:inv_unidades,abreviatura',
        ]);

        try {
            $id = DB::table('inv_unidades')->insertGetId([
                'nombre' => $request->nombre,
                'abreviatura' => $request->abreviatura,
                // 'activo' => true, // We will check if this column exists
            ]);

            return response()->json(['message' => 'Unidad creada correctamente', 'id' => $id], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear unidad: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear unidad'], 500);
        }
    }

    public function show($id)
    {
        try {
            $unidad = DB::table('inv_unidades')->where('id', $id)->first();
            if (! $unidad) {
                return response()->json(['error' => 'Unidad no encontrada'], 404);
            }

            return response()->json($unidad);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al cargar unidad'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'abreviatura' => 'required|string|max:10|unique:inv_unidades,abreviatura,'.$id,
        ]);

        try {
            DB::table('inv_unidades')->where('id', $id)->update([
                'nombre' => $request->nombre,
                'abreviatura' => $request->abreviatura,
            ]);

            return response()->json(['message' => 'Unidad actualizada']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar unidad'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $enUso = DB::table('inv_productos')->where('unidad_id', $id)->exists();
            if ($enUso) {
                return response()->json(['error' => 'No se puede eliminar, unidad en uso'], 400);
            }
            DB::table('inv_unidades')->where('id', $id)->delete();

            return response()->json(['message' => 'Unidad eliminada']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar unidad'], 500);
        }
    }
}
