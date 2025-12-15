<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinCuentaPorPagarController extends Controller
{
    /**
     * Display a listing of accounts payable
     */
    public function index()
    {
        try {
            $cuentas = DB::table('oper_compras as c')
                ->leftJoin('com_proveedores as p', 'c.proveedor_id', '=', 'p.id')
                ->select(
                    'c.id',
                    'c.numero_compra as numero_documento',
                    'c.fecha_compra as fecha_emision',
                    DB::raw('DATE_ADD(c.fecha_compra, INTERVAL 30 DAY) as fecha_vencimiento'),
                    'c.total as monto_total',
                    DB::raw('COALESCE(c.total - (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_proveedores WHERE compra_id = c.id), c.total) as saldo_pendiente'),
                    DB::raw('CASE 
                        WHEN c.total <= (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_proveedores WHERE compra_id = c.id) THEN "pagado"
                        WHEN (SELECT COALESCE(SUM(monto_abonado), 0) FROM fin_pagos_proveedores WHERE compra_id = c.id) > 0 THEN "parcial"
                        ELSE "pendiente"
                    END as estado'),
                    'p.id as proveedor_id',
                    'p.razon_social as proveedor_razon_social'
                )
                ->where('c.estado', '!=', 'anulada')
                ->orderBy('c.fecha_compra', 'desc')
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
                        'proveedor' => [
                            'id' => $cuenta->proveedor_id,
                            'razon_social' => $cuenta->proveedor_razon_social
                        ]
                    ];
                });

            return response()->json($cuentas);
        } catch (\Exception $e) {
            Log::error('Error en CXP index: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar cuentas por pagar'], 500);
        }
    }

    /**
     * Register a payment for an account payable
     */
    public function registrarPago(Request $request, $id)
    {
        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'fecha_pago' => 'required|date',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,cheque',
            'numero_referencia' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string|max:500'
        ]);

        DB::beginTransaction();
        try {
            // Verificar que la compra existe
            $compra = DB::table('oper_compras')->where('id', $id)->first();
            if (!$compra) {
                return response()->json(['error' => 'Compra no encontrada'], 404);
            }

            // Calcular saldo pendiente
            $pagosAnteriores = DB::table('fin_pagos_proveedores')
                ->where('compra_id', $id)
                ->sum('monto_abonado');
            
            $saldoPendiente = $compra->total - $pagosAnteriores;

            if (($request->monto - $saldoPendiente) > 0.01) {
                return response()->json(['error' => 'El monto excede el saldo pendiente'], 400);
            }

            // Registrar el pago
            DB::table('fin_pagos_proveedores')->insert([
                'compra_id' => $id,
                // 'proveedor_id' => $compra->proveedor_id, // Table probably doesnt have this redundant FK, model doesnt show it in fillable
                'fecha_pago' => $request->fecha_pago,
                'monto_abonado' => $request->monto,
                'metodo_pago' => $request->metodo_pago,
                'referencia' => $request->numero_referencia,
                // 'observaciones' => $request->observaciones,
                'usuario_pagador_id' => auth()->id(),
                // 'created_at' => now(),
            ]);

            DB::commit();
            return response()->json(['message' => 'Pago registrado correctamente'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar pago CXP: ' . $e->getMessage());
            return response()->json(['error' => 'Error al registrar pago: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified account payable
     */
    public function show($id)
    {
        try {
            $cuenta = DB::table('oper_compras as c')
                ->leftJoin('com_proveedores as p', 'c.proveedor_id', '=', 'p.id')
                ->select('c.*', 'p.razon_social as proveedor_razon_social')
                ->where('c.id', $id)
                ->first();

            if (!$cuenta) {
                return response()->json(['error' => 'Cuenta no encontrada'], 404);
            }

            $pagos = DB::table('fin_pagos_proveedores')
                ->where('compra_id', $id)
                ->orderBy('fecha_pago', 'desc')
                ->get();

            return response()->json([
                'cuenta' => $cuenta,
                'pagos' => $pagos
            ]);
        } catch (\Exception $e) {
            Log::error('Error en CXP show: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar cuenta'], 500);
        }
    }
}
