<?php

namespace App\Http\Controllers\Contabilidad;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContPartidaController extends Controller
{
    /**
     * Display a listing of journal entries
     */
    public function index()
    {
        try {
            $partidas = DB::table('cont_partidas as p')
                ->leftJoin('sys_usuarios as u', 'p.usuario_id', '=', 'u.id')
                ->select(
                    'p.id',
                    'p.numero_partida',
                    'p.fecha',
                    'p.concepto',
                    'p.total_debe',
                    'p.total_haber',
                    'p.estado',
                    'p.created_at',
                    'u.username as usuario_nombre'
                )
                ->orderBy('p.fecha', 'desc')
                ->orderBy('p.numero_partida', 'desc')
                ->get()
                ->map(function ($partida) {
                    return [
                        'id' => $partida->id,
                        'numero_partida' => $partida->numero_partida,
                        'fecha' => $partida->fecha,
                        'concepto' => $partida->concepto,
                        'total_debe' => (float) $partida->total_debe,
                        'total_haber' => (float) $partida->total_haber,
                        'estado' => $partida->estado,
                        'created_at' => $partida->created_at,
                        'usuario' => $partida->usuario_nombre,
                    ];
                });

            return response()->json($partidas);
        } catch (\Exception $e) {
            Log::error('Error en Partidas index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar partidas'], 500);
        }
    }

    /**
     * Store a newly created journal entry
     */
    public function store(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date',
            'concepto' => 'required|string|max:500',
            'detalles' => 'required|array|min:2',
            'detalles.*.cuenta_id' => 'required|exists:cont_cuentas,id',
            'detalles.*.debe' => 'required|numeric|min:0',
            'detalles.*.haber' => 'required|numeric|min:0',
            'detalles.*.descripcion' => 'nullable|string|max:200',
        ]);

        // Validar partida doble
        $totalDebe = collect($request->detalles)->sum('debe');
        $totalHaber = collect($request->detalles)->sum('haber');

        if (abs($totalDebe - $totalHaber) > 0.01) {
            return response()->json([
                'error' => 'La partida no está cuadrada. Debe = Haber',
                'total_debe' => $totalDebe,
                'total_haber' => $totalHaber,
            ], 400);
        }

        // Validar que cada detalle tenga debe O haber, no ambos
        foreach ($request->detalles as $detalle) {
            if ($detalle['debe'] > 0 && $detalle['haber'] > 0) {
                return response()->json([
                    'error' => 'Cada línea debe tener debe O haber, no ambos',
                ], 400);
            }
            if ($detalle['debe'] == 0 && $detalle['haber'] == 0) {
                return response()->json([
                    'error' => 'Cada línea debe tener un monto en debe o haber',
                ], 400);
            }
        }

        // Validar que las cuentas acepten movimiento
        $cuentasIds = collect($request->detalles)->pluck('cuenta_id')->unique();
        $cuentasInvalidas = DB::table('cont_cuentas')
            ->whereIn('id', $cuentasIds)
            ->where('es_cuenta_movimiento', false)
            ->pluck('nombre_cuenta');

        if ($cuentasInvalidas->count() > 0) {
            return response()->json([
                'error' => 'Las siguientes cuentas no aceptan movimientos: '.$cuentasInvalidas->implode(', '),
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Generar número de partida
            $ultimaPartida = DB::table('cont_partidas')
                ->whereYear('fecha', date('Y', strtotime($request->fecha)))
                ->max('numero_partida');

            $numeroPartida = 'P-'.date('Y', strtotime($request->fecha)).'-'.str_pad(($ultimaPartida ? intval(substr($ultimaPartida, -4)) + 1 : 1), 4, '0', STR_PAD_LEFT);

            // Crear partida
            $partidaId = DB::table('cont_partidas')->insertGetId([
                'numero_partida' => $numeroPartida,
                'fecha' => $request->fecha,
                'concepto' => $request->concepto,
                'total_debe' => $totalDebe,
                'total_haber' => $totalHaber,
                'estado' => 'activa',
                'usuario_id' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Crear detalles
            foreach ($request->detalles as $detalle) {
                DB::table('cont_partidas_det')->insert([
                    'partida_id' => $partidaId,
                    'cuenta_id' => $detalle['cuenta_id'],
                    'debe' => $detalle['debe'],
                    'haber' => $detalle['haber'],
                    'descripcion' => $detalle['descripcion'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Partida creada correctamente',
                'id' => $partidaId,
                'numero_partida' => $numeroPartida,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear partida: '.$e->getMessage());

            return response()->json(['error' => 'Error al crear partida'], 500);
        }
    }

    /**
     * Display the specified journal entry
     */
    public function show($id)
    {
        try {
            $partida = DB::table('cont_partidas')->where('id', $id)->first();

            if (! $partida) {
                return response()->json(['error' => 'Partida no encontrada'], 404);
            }

            $detalles = DB::table('cont_partidas_det as d')
                ->join('cont_cuentas as c', 'd.cuenta_id', '=', 'c.id')
                ->where('d.partida_id', $id)
                ->select(
                    'd.id',
                    'd.cuenta_id',
                    'c.codigo_cuenta as cuenta_codigo',
                    'c.nombre_cuenta as cuenta_nombre',
                    'd.debe',
                    'd.haber',
                    'd.descripcion'
                )
                ->get();

            return response()->json([
                'partida' => $partida,
                'detalles' => $detalles,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en Partida show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar partida'], 500);
        }
    }

    /**
     * Anular a journal entry
     */
    public function anular($id)
    {
        try {
            $partida = DB::table('cont_partidas')->where('id', $id)->first();

            if (! $partida) {
                return response()->json(['error' => 'Partida no encontrada'], 404);
            }

            if ($partida->estado === 'anulada') {
                return response()->json(['error' => 'La partida ya está anulada'], 400);
            }

            DB::table('cont_partidas')
                ->where('id', $id)
                ->update([
                    'estado' => 'anulada',
                    'updated_at' => now(),
                ]);

            return response()->json(['message' => 'Partida anulada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al anular partida: '.$e->getMessage());

            return response()->json(['error' => 'Error al anular partida'], 500);
        }
    }
}
