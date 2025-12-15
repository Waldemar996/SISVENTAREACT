<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SysSerieController extends Controller
{
    /**
     * Display a listing of document series
     */
    public function index()
    {
        try {
            $series = DB::table('sys_series')
                ->select(
                    'id',
                    'tipo_documento',
                    'prefijo',
                    'numero_inicio',
                    'numero_fin',
                    'numero_actual',
                    'longitud',
                    'activa',
                    'descripcion'
                )
                ->orderBy('tipo_documento')
                ->orderBy('prefijo')
                ->get()
                ->map(function ($serie) {
                    return [
                        'id' => $serie->id,
                        'tipo_documento' => $serie->tipo_documento,
                        'prefijo' => $serie->prefijo,
                        'numero_inicio' => $serie->numero_inicio,
                        'numero_fin' => $serie->numero_fin,
                        'numero_actual' => $serie->numero_actual,
                        'longitud' => $serie->longitud,
                        'activa' => (bool) $serie->activa,
                        'descripcion' => $serie->descripcion,
                        'ejemplo' => $serie->prefijo . str_pad($serie->numero_actual, $serie->longitud, '0', STR_PAD_LEFT)
                    ];
                });

            return response()->json($series);
        } catch (\Exception $e) {
            Log::error('Error en Series index: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar series'], 500);
        }
    }

    /**
     * Store a newly created document series
     */
    public function store(Request $request)
    {
        $request->validate([
            'tipo_documento' => 'required|in:factura,cotizacion,compra,venta,devolucion,traslado,partida,recibo',
            'prefijo' => 'required|string|max:10',
            'numero_inicio' => 'required|integer|min:1',
            'numero_fin' => 'required|integer|min:1',
            'longitud' => 'required|integer|min:1|max:10',
            'descripcion' => 'nullable|string|max:200'
        ]);

        // Validar que numero_fin > numero_inicio
        if ($request->numero_fin <= $request->numero_inicio) {
            return response()->json([
                'error' => 'El número final debe ser mayor al número inicial'
            ], 400);
        }

        // Verificar que no exista otra serie activa para el mismo tipo
        $existeActiva = DB::table('sys_series')
            ->where('tipo_documento', $request->tipo_documento)
            ->where('activa', true)
            ->exists();

        if ($existeActiva) {
            return response()->json([
                'error' => 'Ya existe una serie activa para este tipo de documento'
            ], 400);
        }

        try {
            $id = DB::table('sys_series')->insertGetId([
                'tipo_documento' => $request->tipo_documento,
                'prefijo' => $request->prefijo,
                'numero_inicio' => $request->numero_inicio,
                'numero_fin' => $request->numero_fin,
                'numero_actual' => $request->numero_inicio,
                'longitud' => $request->longitud,
                'activa' => true,
                'descripcion' => $request->descripcion,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'message' => 'Serie creada correctamente',
                'id' => $id
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear serie: ' . $e->getMessage());
            return response()->json(['error' => 'Error al crear serie'], 500);
        }
    }

    /**
     * Display the specified document series
     */
    public function show($id)
    {
        try {
            $serie = DB::table('sys_series')->where('id', $id)->first();
            
            if (!$serie) {
                return response()->json(['error' => 'Serie no encontrada'], 404);
            }

            return response()->json($serie);
        } catch (\Exception $e) {
            Log::error('Error en Serie show: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar serie'], 500);
        }
    }

    /**
     * Update the specified document series
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'tipo_documento' => 'required|in:factura,cotizacion,compra,venta,devolucion,traslado,partida,recibo',
            'prefijo' => 'required|string|max:10',
            'numero_fin' => 'required|integer|min:1',
            'longitud' => 'required|integer|min:1|max:10',
            'activa' => 'required|boolean',
            'descripcion' => 'nullable|string|max:200'
        ]);

        try {
            $serie = DB::table('sys_series')->where('id', $id)->first();
            
            if (!$serie) {
                return response()->json(['error' => 'Serie no encontrada'], 404);
            }

            // Validar que numero_fin >= numero_actual
            if ($request->numero_fin < $serie->numero_actual) {
                return response()->json([
                    'error' => 'El número final no puede ser menor al número actual'
                ], 400);
            }

            // Si se está activando, verificar que no haya otra activa
            if ($request->activa && !$serie->activa) {
                $existeActiva = DB::table('sys_series')
                    ->where('tipo_documento', $request->tipo_documento)
                    ->where('activa', true)
                    ->where('id', '!=', $id)
                    ->exists();

                if ($existeActiva) {
                    return response()->json([
                        'error' => 'Ya existe otra serie activa para este tipo de documento'
                    ], 400);
                }
            }

            DB::table('sys_series')
                ->where('id', $id)
                ->update([
                    'tipo_documento' => $request->tipo_documento,
                    'prefijo' => $request->prefijo,
                    'numero_fin' => $request->numero_fin,
                    'longitud' => $request->longitud,
                    'activa' => $request->activa,
                    'descripcion' => $request->descripcion,
                    'updated_at' => now()
                ]);

            return response()->json(['message' => 'Serie actualizada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar serie: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar serie'], 500);
        }
    }

    /**
     * Remove the specified document series
     */
    public function destroy($id)
    {
        try {
            $serie = DB::table('sys_series')->where('id', $id)->first();
            
            if (!$serie) {
                return response()->json(['error' => 'Serie no encontrada'], 404);
            }

            // Verificar si se ha usado (numero_actual > numero_inicio)
            if ($serie->numero_actual > $serie->numero_inicio) {
                return response()->json([
                    'error' => 'No se puede eliminar porque ya se han generado documentos con esta serie'
                ], 400);
            }

            DB::table('sys_series')->where('id', $id)->delete();

            return response()->json(['message' => 'Serie eliminada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar serie: ' . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar serie'], 500);
        }
    }

    /**
     * Get next number for a document type
     */
    public function getNextNumber($tipoDocumento)
    {
        try {
            $serie = DB::table('sys_series')
                ->where('tipo_documento', $tipoDocumento)
                ->where('activa', true)
                ->first();

            if (!$serie) {
                return response()->json(['error' => 'No hay serie activa para este tipo de documento'], 404);
            }

            if ($serie->numero_actual > $serie->numero_fin) {
                return response()->json(['error' => 'La serie ha alcanzado su límite'], 400);
            }

            $numeroCompleto = $serie->prefijo . str_pad($serie->numero_actual, $serie->longitud, '0', STR_PAD_LEFT);

            return response()->json([
                'serie_id' => $serie->id,
                'numero' => $numeroCompleto,
                'numero_actual' => $serie->numero_actual
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener siguiente número: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener siguiente número'], 500);
        }
    }
}
