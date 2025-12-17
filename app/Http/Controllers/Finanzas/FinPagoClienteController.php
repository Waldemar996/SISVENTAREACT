<?php

namespace App\Http\Controllers\Finanzas;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FinPagoClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Listar Facturas Pendientes (CXC)
        // Filtramos ventas con estado PENDIENTE
        $pendientes = \App\Models\Operaciones\OperVenta::with(['cliente'])
            ->where('estado', 'PENDIENTE') // O PARCIAL
            ->get()
            ->map(function ($venta) {
                // Calcular Saldo en Tiempo Real
                $pagado = \App\Models\Finanzas\FinPagoCliente::where('venta_id', $venta->id)->sum('monto_abonado');
                $venta->saldo_pendiente = $venta->total_venta - $pagado;

                return $venta;
            })
            ->filter(function ($venta) {
                return $venta->saldo_pendiente > 0.01; // Filtrar errores de decimales
            });

        return response()->json($pendientes->values());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'venta_id' => 'required|exists:oper_ventas,id',
            'monto_abonado' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|string',
        ]);

        $venta = \App\Models\Operaciones\OperVenta::findOrFail($validated['venta_id']);

        // 1. Validar Caja (Solo si es pago en efectivo, aunque por seguridad pedimos siempre)
        $sesionActiva = \App\Models\Tesoreria\TesSesionCaja::where('usuario_id', auth()->id())
            ->where('estado', 'abierta')->first();
        if (! $sesionActiva) {
            return response()->json(['message' => 'Debe abrir caja para recibir abonos.'], 403);
        }

        // 2. Validar que no pague de más
        $pagadoPreviamente = \App\Models\Finanzas\FinPagoCliente::where('venta_id', $venta->id)->sum('monto_abonado');
        $saldo = $venta->total_venta - $pagadoPreviamente;

        if ($validated['monto_abonado'] > ($saldo + 0.01)) { // Tolerancia decimal
            return response()->json(['message' => 'El abono supera el saldo pendiente (Q'.number_format($saldo, 2).')'], 422);
        }

        // 3. Registrar Pago
        $pago = \App\Models\Finanzas\FinPagoCliente::create([
            'venta_id' => $venta->id,
            'fecha_pago' => now(),
            'monto_abonado' => $validated['monto_abonado'],
            'metodo_pago' => $validated['metodo_pago'],
            'sesion_caja_id' => $sesionActiva->id,
            'usuario_cobrador_id' => auth()->id(),
            'referencia' => $request->referencia,
        ]);

        // 4. Actualizar Estado de Venta
        $nuevoPagado = $pagadoPreviamente + $validated['monto_abonado'];
        if ($nuevoPagado >= ($venta->total_venta - 0.01)) {
            $venta->update(['estado' => 'COMPLETADO']); // Pagada
        }

        return response()->json(['message' => 'Abono registrado', 'data' => $pago], 201);
    }
}
