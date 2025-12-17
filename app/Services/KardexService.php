<?php

namespace App\Services;

use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvKardex;
use App\Models\Inventario\InvProducto;
use Exception;

class KardexService
{
    /**
     * Registra un movimiento de inventario.
     *
     * @param  int  $bodegaId
     * @param  int  $productoId
     * @param  string  $tipoMovimiento  Valores válidos: 'compra', 'venta', 'ajuste', 'traslado_entrada', 'traslado_salida', 'devolucion', 'produccion'
     * @param  float  $cantidad  Cantidad siempre positiva
     * @param  float  $costoUnitario  Costo del movimiento
     * @param  string  $referencia  Tipo de documento (VENTA, COMPRA, AJUSTE)
     * @param  string  $referenciaId  ID del documento
     *
     * @throws Exception
     */
    public function registrarMovimiento($bodegaId, $productoId, $tipoMovimiento, $cantidad, $costoUnitario, $referencia, $referenciaId)
    {
        // Mapa de naturaleza del movimiento
        $entradas = ['compra', 'traslado_entrada', 'devolucion', 'produccion'];
        $salidas = ['venta', 'traslado_salida', 'consumo_produccion', 'devolucion_compra'];

        $esEntrada = in_array($tipoMovimiento, $entradas);
        $esSalida = in_array($tipoMovimiento, $salidas);

        // Caso especial: Ajuste (por ahora lo tratamos como entrada si no está definido, pero debería manejarse mejor.
        // Asumiremos que ajuste se maneja con otro método o que por defecto suma si no se especifica 'ajuste_negativo' que no existe en enum)
        // Solución temporal para ajuste: Si es ajuste, por ahora no hacemos nada o lanzamos error si no es compra/venta

        if (! $esEntrada && ! $esSalida && $tipoMovimiento !== 'ajuste') {
            throw new Exception("Tipo de movimiento inválido: {$tipoMovimiento}");
        }

        // Obtener o Crear registro de stock en bodega
        $stockBodega = InvBodegaProducto::firstOrCreate(
            ['bodega_id' => $bodegaId, 'producto_id' => $productoId],
            ['existencia' => 0]
        );

        $producto = InvProducto::findOrFail($productoId);

        $stockAnterior = $stockBodega->existencia ?? 0;
        $costoPromedioActual = $producto->costo_promedio;

        $nuevoStock = 0;
        $nuevoCostoPromedio = $costoPromedioActual;

        // Cálculos
        if ($esEntrada || ($tipoMovimiento === 'ajuste' && $cantidad > 0)) { // Asumir ajuste positivo por ahora
            $nuevoStock = $stockAnterior + $cantidad;

            // Recalcular Costo Promedio Ponderado (Solo en entradas de compra o producción)
            if ($tipoMovimiento === 'compra' || $tipoMovimiento === 'produccion') {
                if ($nuevoStock > 0) {
                    $nuevoCostoPromedio = (($stockAnterior * $costoPromedioActual) + ($cantidad * $costoUnitario)) / $nuevoStock;
                }
            }

        } elseif ($esSalida) {
            // Only validate stock if product controls it
            if ($producto->controla_stock && $stockAnterior < $cantidad) {
                throw new Exception("Stock insuficiente para el producto ID: {$productoId}. Disponible: {$stockAnterior}, Solicitado: {$cantidad}");
            }
            // Allow negative stock for non-tracked products or if check passed
            $nuevoStock = $stockAnterior - $cantidad;
            // En salidas el costo promedio se mantiene (FIFO/PMP), pero el registro del kardex usa el costo promedio actual
            $costoUnitario = $costoPromedioActual;
        }

        // 1. Actualizar Stock en Bodega
        $stockBodega->existencia = $nuevoStock;
        $stockBodega->save();

        // 2. Actualizar Costo Promedio Global
        if ($producto->costo_promedio != $nuevoCostoPromedio) {
            $producto->costo_promedio = $nuevoCostoPromedio;
            $producto->save();
        }

        // 3. Insertar Movimiento en Kardex
        InvKardex::create([
            'bodega_id' => $bodegaId,
            'producto_id' => $productoId,
            'fecha' => now(),
            'tipo_movimiento' => $tipoMovimiento,
            'cantidad' => $cantidad,
            'costo_unitario' => $costoUnitario,
            'costo_total' => $cantidad * $costoUnitario,
            'stock_anterior' => $stockAnterior,
            'stock_nuevo' => $nuevoStock, // Corrected from stock_actual
            'referencia_tipo' => substr($referencia, 0, 50),
            'referencia_id' => $referenciaId,
            'costo_promedio' => $nuevoCostoPromedio,
            'glosa' => "Movimiento automático {$tipoMovimiento} ref: {$referencia}-{$referenciaId}",
        ]);

        return true;
    }
}
