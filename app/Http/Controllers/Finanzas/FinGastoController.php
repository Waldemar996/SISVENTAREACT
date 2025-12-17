<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FinGastoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Listar gastos recientes
        return response()->json(
            \App\Models\Finanzas\FinGasto::with(['usuario', 'categoria'])
                ->orderBy('id', 'desc')
                ->paginate(20)
        );
    }

    public function categorias()
    {
        return response()->json(\App\Models\Finanzas\FinCategoriaGasto::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|max:255',
            'monto' => 'required|numeric|min:0.01',
            'categoria_id' => 'nullable|integer', // Por ahora opcional
        ]);

        // 1. Validar Caja Abierta (Obligatorio para sacar dinero efectivo)
        // Si fuera pago con Cheque/Banco, podría ser opcional, pero simplificaremos asumiendo "Gastos Menores" de caja.
        $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', auth()->id())
            ->where('estado', 'abierta')
            ->first();

        if (! $sesionActiva) {
            return response()->json(['message' => 'Debe tener una CAJA ABIERTA para registrar gastos.'], 403);
        }

        // 2. Crear Gasto
        $gasto = \App\Models\Finanzas\FinGasto::create([
            'descripcion' => $validated['descripcion'],
            'monto' => $validated['monto'],
            'categoria_id' => $request->categoria_id,
            'fecha_gasto' => now(),
            'usuario_id' => auth()->id(),
            'sesion_caja_id' => $sesionActiva->id, // Vinculado al arqueo
        ]);

        return response()->json(['message' => 'Gasto registrado', 'data' => $gasto], 201);
    }

    public function show(string $id)
    {
        return response()->json(\App\Models\Finanzas\FinGasto::findOrFail($id));
    }
}
