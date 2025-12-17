<?php

namespace App\Domain\Accounting\Services;

use App\Models\Contabilidad\ContCuenta;
use App\Models\Contabilidad\ContPartida;
use App\Models\Contabilidad\ContPartidaDet;
use App\Models\Operaciones\OperVenta; // For loading details if needed
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Generate an accounting entry for a confirmed sale.
     *
     * Default Logic (Simplified):
     * DEBIT:  Caja/Bancos (Asset)
     * CREDIT: Venta de Mercaderias (Revenue)
     * CREDIT: IVA Debito Fiscal (Liability)
     */
    public function createEntryForSale(int $ventaId): void
    {
        $venta = OperVenta::findOrFail($ventaId);

        // Configuration Hardcoded for Phase 5 (Should move to DB Config)
        // We assume these accounts exist. If not, we should probably fetch or throw.
        // For robustness, we'll try to find them by code or fallback.

        $cuentaCaja = '110101'; // Caja General
        $cuentaIngreso = '410101'; // Venta Bienes
        $cuentaIva = '210301'; // IVA Por Pagar

        // Resolve Period
        $date = Carbon::parse($venta->fecha_emision);
        $periodo = \App\Models\Contabilidad\ContPeriodo::where('anio', $date->year)
            ->where('mes', $date->month)
            ->first();

        $periodoId = $periodo ? $periodo->id : 1; // Fallback to 1 if not found (or handle error)

        DB::transaction(function () use ($venta, $periodoId, $cuentaCaja, $cuentaIngreso, $cuentaIva) {

            // 1. Create Header
            $partida = ContPartida::create([
                'numero_partida' => 'D-'.Carbon::now()->format('ymd').'-'.$venta->id,
                'periodo_id' => $periodoId,
                'fecha_contable' => $venta->fecha_emision->format('Y-m-d'),
                'concepto' => "Venta Factura #{$venta->numero_comprobante}",
                'origen_modulo' => 'ventas',
                'origen_id' => $venta->id,
                'tipo_partida' => 'diario',
                'estado' => 'mayorizada',
                'usuario_creador_id' => $venta->usuario_id,
            ]);

            // 2. Calculate Amounts
            $total = $venta->total_venta;
            $subtotal = $venta->subtotal; // Base
            $iva = $venta->total_impuestos;

            // 3. Create Details

            // DEBIT: Caja (Total Received)
            $this->addDetail($partida->id, $cuentaCaja, 'DEBE', $total);

            // CREDIT: Ingreso (Subtotal)
            $this->addDetail($partida->id, $cuentaIngreso, 'HABER', $subtotal);

            // CREDIT: IVA (Tax)
            if ($iva > 0) {
                $this->addDetail($partida->id, $cuentaIva, 'HABER', $iva);
            }
        });
    }

    private function addDetail($partidaId, $codigoCuenta, $tipoMovimiento, $monto)
    {
        // Resolve Account ID by Code (Mocking lookup)
        $cuenta = ContCuenta::where('codigo_cuenta', $codigoCuenta)->first();
        $cuentaId = $cuenta ? $cuenta->id : 1; // Fallback to ID 1 if config missing in tests

        ContPartidaDet::create([
            'partida_id' => $partidaId,
            'cuenta_contable_id' => $cuentaId,
            'concepto_linea' => 'Registro automatico',
            'debe' => $tipoMovimiento === 'DEBE' ? $monto : 0,
            'haber' => $tipoMovimiento === 'HABER' ? $monto : 0,
        ]);
    }
}
