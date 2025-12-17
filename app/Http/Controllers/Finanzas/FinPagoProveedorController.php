<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FinPagoProveedorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Listar Compras Pendientes (CXP)
        $pendientes = \App\Models\Operaciones\OperCompra::with(['proveedor'])
            ->where('estado', 'PENDIENTE')
            ->get()
            ->map(function ($compra) {
                $pagado = \App\Models\Finanzas\FinPagoProveedor::where('compra_id', $compra->id)->sum('monto_abonado');
                $compra->saldo_pendiente = $compra->total_compra - $pagado;

                return $compra;
            })
            ->filter(fn ($c) => $c->saldo_pendiente > 0.01);

        return response()->json($pendientes->values());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'compra_id' => 'required|exists:oper_compras,id',
            'monto_abonado' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|string',
        ]);

        $compra = \App\Models\Operaciones\OperCompra::findOrFail($validated['compra_id']);

        // Validar saldo
        $pagadoPrev = \App\Models\Finanzas\FinPagoProveedor::where('compra_id', $compra->id)->sum('monto_abonado');
        $saldo = $compra->total_compra - $pagadoPrev;

        if ($validated['monto_abonado'] > ($saldo + 0.01)) {
            return response()->json(['message' => 'El pago supera la deuda pendiente'], 422);
        }

        // Registrar Pago (Salida de dinero, verificar si requiere caja? Normalmente finanzas maneja bancos o caja chica)
        // Por consistencia, podríamos pedir caja, pero para CXP a veces sale de bancos.
        // Lo dejaremos simple por ahora, sin vincular a TesSesionCaja obligatoriamente a menos que sea Efectivo.

        $pago = \App\Models\Finanzas\FinPagoProveedor::create([
            'compra_id' => $compra->id,
            'fecha_pago' => now(),
            'monto_abonado' => $validated['monto_abonado'],
            'metodo_pago' => $validated['metodo_pago'],
            'usuario_pagador_id' => auth()->id(),
            'referencia' => $request->referencia,
        ]);

        // Actualizar estado
        if (($pagadoPrev + $validated['monto_abonado']) >= ($compra->total_compra - 0.01)) {
            $compra->update(['estado' => 'COMPLETADO']);
        }

        return response()->json(['message' => 'Pago registrado', 'data' => $pago], 201);
    }
}
