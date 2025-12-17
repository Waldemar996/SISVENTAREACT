<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContCuentaController extends Controller
{
    /**
     * Display a listing of chart of accounts
     */
    public function index()
    {
        try {
            $cuentas = DB::table('cont_cuentas')
                ->whereNull('deleted_at')
                ->select(
                    'id',
                    'codigo_cuenta as codigo',
                    'nombre_cuenta as nombre',
                    'tipo',
                    'nivel',
                    'cuenta_padre_id',
                    'es_cuenta_movimiento as acepta_movimiento'
                )
                ->orderBy('codigo_cuenta')
                ->get()
                ->map(function ($cuenta) {
                    return [
                        'id' => $cuenta->id,
                        'codigo' => $cuenta->codigo,
                        'nombre' => $cuenta->nombre,
                        'tipo' => $cuenta->tipo,
                        'nivel' => $cuenta->nivel,
                        'cuenta_padre_id' => $cuenta->cuenta_padre_id,
                        'acepta_movimiento' => (bool) $cuenta->acepta_movimiento,
                        'activa' => true, // Default to true as column missing
                        'descripcion' => '', // Default empty
                    ];
                });

            return response()->json($cuentas);
        } catch (\Exception $e) {
            Log::error('Error en Cuentas index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar catálogo de cuentas'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'codigo' => 'required|string|max:20|unique:cont_cuentas,codigo_cuenta',
            'nombre' => 'required|string|max:200',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,orden',
            'nivel' => 'required|integer|min:1|max:5',
            'cuenta_padre_id' => 'nullable|exists:cont_cuentas,id',
            'acepta_movimiento' => 'required|boolean',
        ]);

        try {
            // Si tiene cuenta padre, verificar que el padre no acepte movimientos
            if ($request->cuenta_padre_id) {
                $padre = DB::table('cont_cuentas')->where('id', $request->cuenta_padre_id)->first();
                if ($padre && $padre->es_cuenta_movimiento) {
                    // Actualizar padre para que no acepte movimientos
                    DB::table('cont_cuentas')
                        ->where('id', $request->cuenta_padre_id)
                        ->update(['es_cuenta_movimiento' => false]);
                }
            }

            $id = DB::table('cont_cuentas')->insertGetId([
                'codigo_cuenta' => $request->codigo,
                'nombre_cuenta' => $request->nombre,
                'tipo' => $request->tipo,
                'nivel' => $request->nivel,
                'cuenta_padre_id' => $request->cuenta_padre_id,
                'es_cuenta_movimiento' => $request->acepta_movimiento,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Cuenta creada correctamente',
                'id' => $id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error al crear cuenta: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear cuenta'], 500);
        }
    }

    public function show($id)
    {
        try {
            $cuenta = DB::table('cont_cuentas')->where('id', $id)->first();

            if (! $cuenta) {
                return response()->json(['error' => 'Cuenta no encontrada'], 404);
            }

            // Mappear nombres antiguos para respuesta
            $cuentaMapped = [
                'id' => $cuenta->id,
                'codigo' => $cuenta->codigo_cuenta,
                'nombre' => $cuenta->nombre_cuenta,
                'tipo' => $cuenta->tipo,
                'nivel' => $cuenta->nivel,
                'cuenta_padre_id' => $cuenta->cuenta_padre_id,
                'acepta_movimiento' => (bool) $cuenta->es_cuenta_movimiento,
                'activa' => true,
                'descripcion' => '',
            ];

            // Obtener cuentas hijas
            $hijas = DB::table('cont_cuentas')
                ->where('cuenta_padre_id', $id)
                ->whereNull('deleted_at')
                ->get();

            return response()->json([
                'cuenta' => $cuentaMapped,
                'hijas' => $hijas,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en Cuenta show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar cuenta'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'codigo' => 'required|string|max:20|unique:cont_cuentas,codigo_cuenta,'.$id,
            'nombre' => 'required|string|max:200',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,orden',
            'acepta_movimiento' => 'required|boolean',
        ]);

        try {
            // Verificar si tiene hijas
            $tieneHijas = DB::table('cont_cuentas')
                ->where('cuenta_padre_id', $id)
                ->whereNull('deleted_at')
                ->exists();

            if ($tieneHijas && $request->acepta_movimiento) {
                return response()->json([
                    'error' => 'No puede aceptar movimientos porque tiene cuentas hijas',
                ], 400);
            }

            DB::table('cont_cuentas')
                ->where('id', $id)
                ->update([
                    'codigo_cuenta' => $request->codigo,
                    'nombre_cuenta' => $request->nombre,
                    'tipo' => $request->tipo,
                    'es_cuenta_movimiento' => $request->acepta_movimiento,
                    'updated_at' => now(),
                ]);

            return response()->json(['message' => 'Cuenta actualizada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar cuenta: '.$e->getMessage());

            return response()->json(['error' => 'Error al actualizar cuenta'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Verificar si tiene movimientos
            $tieneMovimientos = DB::table('cont_partidas_det')
                ->where('cuenta_id', $id)
                ->exists();

            if ($tieneMovimientos) {
                return response()->json([
                    'error' => 'No se puede eliminar porque tiene movimientos registrados',
                ], 400);
            }

            // Verificar si tiene hijas
            $tieneHijas = DB::table('cont_cuentas')
                ->where('cuenta_padre_id', $id)
                ->whereNull('deleted_at')
                ->exists();

            if ($tieneHijas) {
                return response()->json([
                    'error' => 'No se puede eliminar porque tiene cuentas hijas',
                ], 400);
            }

            DB::table('cont_cuentas')->where('id', $id)->update(['deleted_at' => now()]);

            return response()->json(['message' => 'Cuenta eliminada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar cuenta: '.$e->getMessage());

            return response()->json(['error' => 'Error al eliminar cuenta'], 500);
        }
    }
}
