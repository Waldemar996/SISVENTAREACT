<?php

namespace App\Http\Controllers\RRHH;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RrhhDepartamentoController extends Controller
{
    public function index()
    {
        try {
            $departamentos = DB::table('rrhh_departamentos')
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get()
                ->map(function ($depto) {
                    return [
                        'id' => $depto->id,
                        'nombre' => $depto->nombre,
                        'activo' => true, // Default true
                    ];
                });

            return response()->json($departamentos);
        } catch (\Exception $e) {
            Log::error('Error en Departamentos index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar departamentos'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:rrhh_departamentos,nombre',
        ]);

        try {
            $id = DB::table('rrhh_departamentos')->insertGetId([
                'nombre' => $request->nombre,
                // 'activo' => true,
                // 'created_at' => now(),
                // 'updated_at' => now()
            ]);

            return response()->json(['message' => 'Departamento creado correctamente', 'id' => $id], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear departamento: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear departamento'], 500);
        }
    }

    public function show($id)
    {
        try {
            $departamento = DB::table('rrhh_departamentos')->where('id', $id)->first();

            if (! $departamento) {
                return response()->json(['error' => 'Departamento no encontrado'], 404);
            }

            return response()->json($departamento);
        } catch (\Exception $e) {
            Log::error('Error en Departamento show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar departamento'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:100|unique:rrhh_departamentos,nombre,'.$id,
            // 'activo' => 'required|boolean',
        ]);

        try {
            DB::table('rrhh_departamentos')
                ->where('id', $id)
                ->update([
                    'nombre' => $request->nombre,
                    // 'activo' => $request->activo,
                    // 'updated_at' => now()
                ]);

            return response()->json(['message' => 'Departamento actualizado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar departamento: '.$e->getMessage());

            return response()->json(['error' => 'Error al actualizar departamento'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Verificar si está en uso
            $enUso = DB::table('rrhh_puestos')->where('departamento_id', $id)->exists();

            if ($enUso) {
                return response()->json([
                    'error' => 'No se puede eliminar porque hay puestos asignados a este departamento',
                ], 400);
            }

            DB::table('rrhh_departamentos')->where('id', $id)->delete();

            return response()->json(['message' => 'Departamento eliminado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar departamento: '.$e->getMessage());

            return response()->json(['error' => 'Error al eliminar departamento'], 500);
        }
    }
}
