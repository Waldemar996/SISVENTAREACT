<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinCuentaPorCobrarController extends Controller
{
    /**
     * Display a listing of accounts receivable
     */
    public function index()
    {
        try {
            $cuentas = DB::table('oper_ventas as v')
                ->leftJoin('com_clientes as c', 'v.cliente_id', '=', 'c.id')
                ->select(
                    'v.id',
                    'v.numero_venta as numero_documento',
                    'v.fecha_venta as fecha_emision',
                    DB::raw('DATE_ADD(v.fecha_venta, INTERVAL 30 DAY) as fecha_vencimiento'),
                    'v.total as monto_total',
                    DB::raw('COALESCE(v.total - (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_clientes WHERE venta_id = v.id), v.total) as saldo_pendiente'),
                    DB::raw('CASE 
                        WHEN v.total <= (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_clientes WHERE venta_id = v.id) THEN "pagado"
                        WHEN (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_clientes WHERE venta_id = v.id) > 0 THEN "parcial"
                        ELSE "pendiente"
                    END as estado'),
                    'c.id as cliente_id',
                    'c.razon_social as cliente_razon_social'
                )
                ->where('v.estado', '!=', 'anulada')
                ->orderBy('v.fecha_venta', 'desc')
                ->get()
                ->map(function ($cuenta) {
                    return [
                        'id' => $cuenta->id,
                        'numero_documento' => $cuenta->numero_documento,
                        'fecha_emision' => $cuenta->fecha_emision,
                        'fecha_vencimiento' => $cuenta->fecha_vencimiento,
                        'monto_total' => (float) $cuenta->monto_total,
                        'saldo_pendiente' => (float) $cuenta->saldo_pendiente,
                        'estado' => $cuenta->estado,
                        'cliente' => [
                            'id' => $cuenta->cliente_id,
                            'razon_social' => $cuenta->cliente_razon_social,
                        ],
                    ];
                });

            return response()->json($cuentas);
        } catch (\Exception $e) {
            Log::error('Error en CXC index: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar cuentas por cobrar'], 500);
        }
    }

    /**
     * Register a payment for an account receivable
     */
    public function registrarPago(Request $request, $id)
    {
        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'fecha_pago' => 'required|date',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,cheque',
            'numero_referencia' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Verificar que la venta existe
            $venta = DB::table('oper_ventas')->where('id', $id)->first();
            if (! $venta) {
                return response()->json(['error' => 'Venta no encontrada'], 404);
            }

            // Calcular saldo pendiente
            $pagosAnteriores = DB::table('fin_pagos_clientes')
                ->where('venta_id', $id)
                ->sum('monto_abonado');

            $saldoPendiente = $venta->total - $pagosAnteriores;

            // Pequeña tolerancia para errores de punto flotante
            if (($request->monto - $saldoPendiente) > 0.01) {
                return response()->json(['error' => 'El monto excede el saldo pendiente'], 400);
            }

            // Registrar el pago
            DB::table('fin_pagos_clientes')->insert([
                'venta_id' => $id,
                'fecha_pago' => $request->fecha_pago,
                'monto_abonado' => $request->monto,
                'metodo_pago' => $request->metodo_pago,
                'referencia' => $request->numero_referencia, // referencia vs numero_referencia mapping
                // 'observaciones' => $request->observaciones, // Model doesnt show observaciones in fillable but lets verify migration later. Assuming DB::table handles if column exists? No, it throws.
                // Looking at FinPagoCliente model, fillable has 'referencia', not 'numero_referencia'.
                // And does NOT have 'observaciones'.
                // Better stick to what Model has: venta_id, fecha_pago, monto_abonado, metodo_pago, referencia, sesion_caja_id, banco_cuenta_id, usuario_cobrador_id
                'usuario_cobrador_id' => auth()->id(),
                // 'created_at' => now(), // timestamps false in model
            ]);

            DB::commit();

            return response()->json(['message' => 'Pago registrado correctamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar pago CXC: '.$e->getMessage());

            return response()->json(['error' => 'Error al registrar pago: '.$e->getMessage()], 500);
        }
    }

    /**
     * Display the specified account receivable
     */
    public function show($id)
    {
        try {
            $cuenta = DB::table('oper_ventas as v')
                ->leftJoin('com_clientes as c', 'v.cliente_id', '=', 'c.id')
                ->select('v.*', 'c.razon_social as cliente_razon_social')
                ->where('v.id', $id)
                ->first();

            if (! $cuenta) {
                return response()->json(['error' => 'Cuenta no encontrada'], 404);
            }

            $pagos = DB::table('fin_pagos_clientes')
                ->where('venta_id', $id)
                ->orderBy('fecha_pago', 'desc')
                ->get();

            return response()->json([
                'cuenta' => $cuenta,
                'pagos' => $pagos,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en CXC show: '.$e->getMessage());

            return response()->json(['error' => 'Error al cargar cuenta'], 500);
        }
    }
}
