<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SysImpuestoController extends Controller
{
    /**
     * Display a listing of taxes
     */
    public function index()
    {
        try {
            $impuestos = DB::table('sys_impuestos')
                ->select(
                    'id',
                    'codigo',
                    'nombre',
                    'tipo',
                    'porcentaje',
                    'activo',
                    'descripcion'
                )
                ->orderBy('codigo')
                ->get()
                ->map(function ($impuesto) {
                    return [
                        'id' => $impuesto->id,
                        'codigo' => $impuesto->codigo,
                        'nombre' => $impuesto->nombre,
                        'tipo' => $impuesto->tipo,
                        'porcentaje' => (float) $impuesto->porcentaje,
                        'activo' => (bool) $impuesto->activo,
                        'descripcion' => $impuesto->descripcion,
                    ];
                });

            return response()->json($impuestos);
        } catch (\Exception $e) {
            Log::error('Error en Impuestos index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar impuestos'], 500);
        }
    }

    /**
     * Store a newly created tax
     */
    public function store(Request $request)
    {
        $request->validate([
            'codigo' => 'required|string|max:10|unique:sys_impuestos,codigo',
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:IVA,ISR,Timbre,Retención,Otro',
            'porcentaje' => 'required|numeric|min:0|max:100',
            'descripcion' => 'nullable|string|max:300',
        ]);

        try {
            $id = DB::table('sys_impuestos')->insertGetId([
                'codigo' => $request->codigo,
                'nombre' => $request->nombre,
                'tipo' => $request->tipo,
                'porcentaje' => $request->porcentaje,
                'activo' => true,
                'descripcion' => $request->descripcion,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Impuesto creado correctamente',
                'id' => $id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear impuesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear impuesto'], 500);
        }
    }

    /**
     * Display the specified tax
     */
    public function show($id)
    {
        try {
            $impuesto = DB::table('sys_impuestos')->where('id', $id)->first();

            if (! $impuesto) {
                return response()->json(['error' => 'Impuesto no encontrado'], 404);
            }

            return response()->json($impuesto);
        } catch (\Exception $e) {
            Log::error('Error en Impuesto show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar impuesto'], 500);
        }
    }

    /**
     * Update the specified tax
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'codigo' => 'required|string|max:10|unique:sys_impuestos,codigo,'.$id,
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:IVA,ISR,Timbre,Retención,Otro',
            'porcentaje' => 'required|numeric|min:0|max:100',
            'activo' => 'required|boolean',
            'descripcion' => 'nullable|string|max:300',
        ]);

        try {
            DB::table('sys_impuestos')
                ->where('id', $id)
                ->update([
                    'codigo' => $request->codigo,
                    'nombre' => $request->nombre,
                    'tipo' => $request->tipo,
                    'porcentaje' => $request->porcentaje,
                    'activo' => $request->activo,
                    'descripcion' => $request->descripcion,
                    'updated_at' => now(),
                ]);

            return response()->json(['message' => 'Impuesto actualizado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar impuesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al actualizar impuesto'], 500);
        }
    }

    /**
     * Remove the specified tax
     */
    public function destroy($id)
    {
        try {
            // Verificar si está en uso
            $enUso = DB::table('inv_productos')
                ->where('impuesto_id', $id)
                ->exists();

            if ($enUso) {
                return response()->json([
                    'error' => 'No se puede eliminar porque está siendo utilizado por productos',
                ], 400);
            }

            DB::table('sys_impuestos')->where('id', $id)->delete();

            return response()->json(['message' => 'Impuesto eliminado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar impuesto: '.$e->getMessage());

            return response()->json(['error' => 'Error al eliminar impuesto'], 500);
        }
    }
}
