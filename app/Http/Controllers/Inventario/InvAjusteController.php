<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\KardexService;
use App\Services\AuditService;

class InvAjusteController extends Controller
{
    protected $kardexService;

    public function __construct(KardexService $kardexService)
    {
        $this->kardexService = $kardexService;
    }

    /**
     * Store a newly created resource in storage.
     * Strict Audit: Requires 'motivo'.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:inv_productos,id',
            'bodega_id' => 'required|exists:log_bodegas,id',
            'cantidad' => 'required|numeric|min:0.01',
            'tipo_movimiento' => 'required|in:ENTRADA,SALIDA',
            'motivo' => 'required|string|min:5|max:255', // Audit Requirement
        ]);

        try {
            // Register Movement via Domain Service
            $this->kardexService->registrarMovimiento(
                $validated['bodega_id'],
                $validated['producto_id'],
                strtolower($validated['tipo_movimiento']), // 'entrada' or 'salida'
                $validated['cantidad'],
                0, // Cost (Ajuste might imply 0 cost impact or current cost, simplified to 0 for qty adjustment)
                'AJUSTE: ' . $validated['motivo'],
                null // No reference ID like a Venta ID
            );

            // Audit Log
            AuditService::log(
                'INVENTARIO', 
                'AJUSTE_STOCK', 
                'inv_productos', 
                $validated['producto_id'], 
                null, 
                ['cantidad' => $validated['cantidad'], 'tipo' => $validated['tipo_movimiento'], 'motivo' => $validated['motivo']]
            );

            return response()->json(['message' => 'Ajuste realizado y auditado correctamente'], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400); 
        }
    }
}
