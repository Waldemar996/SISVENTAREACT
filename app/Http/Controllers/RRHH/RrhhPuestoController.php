<?php

namespace App\Http\Controllers\RRHH;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RrhhPuestoController extends Controller
{
    public function index()
    {
        try {
            $puestos = DB::table('rrhh_puestos as p')
                ->leftJoin('rrhh_departamentos as d', 'p.departamento_id', '=', 'd.id')
                ->select(
                    'p.id',
                    'p.nombre_puesto',
                    'p.departamento_id',
                    'd.nombre as departamento_nombre'
                )
                ->orderBy('p.nombre_puesto')
                ->get()
                ->map(function ($puesto) {
                    return [
                        'id' => $puesto->id,
                        'nombre_puesto' => $puesto->nombre_puesto,
                        'departamento_id' => $puesto->departamento_id,
                        'activo' => true, // Default to true as column missing
                        'departamento' => $puesto->departamento_nombre ? [
                            'nombre' => $puesto->departamento_nombre,
                        ] : null,
                    ];
                });

            return response()->json($puestos);
        } catch (\Exception $e) {
            Log::error('Error en Puestos index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar puestos'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'departamento_id' => 'required|exists:rrhh_departamentos,id',
        ]);

        try {
            $id = DB::table('rrhh_puestos')->insertGetId([
                'nombre_puesto' => $request->nombre,
                'departamento_id' => $request->departamento_id,
                'salario_base' => 0, // Default value if needed
                // 'activo' => true, // Column missing
            ]);

            return response()->json(['message' => 'Puesto creado correctamente', 'id' => $id], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear puesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear puesto'], 500);
        }
    }

    public function show($id)
    {
        try {
            $puesto = DB::table('rrhh_puestos')->where('id', $id)->first();

            if (! $puesto) {
                return response()->json(['error' => 'Puesto no encontrado'], 404);
            }

            // Map for consistency if needed, or just return raw
            // Frontend expects nombre_puesto mostly
            return response()->json($puesto);
        } catch (\Exception $e) {
            Log::error('Error en Puesto show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar puesto'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'departamento_id' => 'required|exists:rrhh_departamentos,id',
            // 'activo' => 'required|boolean', // Column missing
        ]);

        try {
            DB::table('rrhh_puestos')
                ->where('id', $id)
                ->update([
                    'nombre_puesto' => $request->nombre,
                    'departamento_id' => $request->departamento_id,
                    // 'activo' => $request->activo,
                    // 'updated_at' => now() // No timestamps likely
                ]);

            return response()->json(['message' => 'Puesto actualizado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar puesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al actualizar puesto'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Verificar si está en uso
            $enUso = DB::table('rrhh_empleados')->where('puesto_id', $id)->exists();

            if ($enUso) {
                return response()->json([
                    'error' => 'No se puede eliminar porque hay empleados asignados a este puesto',
                ], 400);
            }

            DB::table('rrhh_puestos')->where('id', $id)->delete();

            return response()->json(['message' => 'Puesto eliminado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar puesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al eliminar puesto'], 500);
        }
    }
}
