<?php

namespace App\Services\AI;

use App\Models\Inventario\InvProducto;
use Illuminate\Support\Facades\DB;

/**
 * Smart Replenishment System
 *
 * Conecta las predicciones de IA con la gestión de compras.
 * Genera propuestas de compra automáticas.
 */
class ReplenishmentService
{
    /**
     * Genera propuestas de compra para todos los productos con predicciones activas
     */
    public function generateProposals()
    {
        // 1. Obtener predicciones "frescas" (del mes objetivo actual o futuro)
        // Usamos la tabla inv_predicciones
        $predictions = DB::table('inv_predicciones')
            ->where('fecha_objetivo', '>=', now()->startOfMonth())
            ->get();

        $proposals = [];

        foreach ($predictions as $pred) {
            $proposal = $this->analyzeProduct($pred->producto_id, $pred->cantidad_predicha, $pred->confianza_score);
            if ($proposal) {
                $proposals[] = $proposal;
            }
        }

        return $proposals;
    }

    /**
     * Analiza un producto individual y decide si necesita compra
     */
    private function analyzeProduct($productId, $predictedQty, $confidence)
    {
        $product = InvProducto::find($productId);
        if (! $product || ! $product->activo) {
            return null;
        }

        // 1. Calcular Stock Total Disponible
        $stockFisico = DB::table('inv_bodega_producto')
            ->where('producto_id', $productId)
            ->sum('existencia');

        // Pedidos en tránsito
        $stockEnTransito = DB::table('oper_compras_det as d')
            ->join('oper_compras as c', 'd.compra_id', '=', 'c.id')
            ->where('d.producto_id', $productId)
            ->whereIn('c.estado', ['ordenada', 'parcial'])
            ->sum('d.cantidad');

        $stockTotal = $stockFisico + $stockEnTransito;

        // 2. Definir Stock de Seguridad
        $safetyStock = $product->stock_minimo > 0
            ? $product->stock_minimo
            : ceil($predictedQty * 0.10);

        // 3. Calcular Necesidad
        $required = ($predictedQty + $safetyStock) - $stockTotal;

        if ($required <= 0) {
            return null;
        }

        // 4. Generar Propuesta
        $prioridad = 'NORMAL';
        if ($stockTotal == 0) {
            $prioridad = 'CRITICA';
        } elseif ($stockTotal < $safetyStock) {
            $prioridad = 'ALTA';
        }

        // Razón legible
        $razon = sprintf(
            'Predicción: %.0f + Seguridad: %.0f = Necesario: %.0f. Stock Total: %.0f. Faltan: %.0f',
            $predictedQty,
            $safetyStock,
            $predictedQty + $safetyStock,
            $stockTotal,
            $required
        );

        // Guardar o Actualizar propuesta en BD
        DB::table('com_propuestas_compra')->updateOrInsert(
            [
                'producto_id' => $productId,
                'estado' => 'pendiente',
            ],
            [
                'proveedor_id' => null,
                'stock_actual' => $stockTotal,
                'prediccion_demanda' => $predictedQty,
                'cantidad_sugerida' => $required,
                'prioridad' => $prioridad,
                'razon_ia' => $razon,
                'confianza_ia' => $confidence,
                'updated_at' => now(),
            ]
        );

        return [
            'product' => $product->nombre,
            'qty' => $required,
            'reason' => $razon,
            'priority' => $prioridad,
            'confidence' => $confidence,
        ];
    }

    /**
     * Aprueba una propuesta y genera la Orden de Compra
     */
    public function approveProposal($proposalId, $userId)
    {
        return DB::transaction(function () use ($proposalId, $userId) {
            $proposal = DB::table('com_propuestas_compra')->where('id', $proposalId)->first();

            if (! $proposal || $proposal->estado !== 'pendiente') {
                return false;
            }

            // 1. Crear Orden de Compra (Borrador)
            $providerId = $proposal->proveedor_id ?? DB::table('com_proveedores')->first()->id;
            $bodegaId = DB::table('log_bodegas')->first()->id;

            $purchaseId = DB::table('oper_compras')->insertGetId([
                'tipo_comprobante' => 'orden_compra',
                'numero_comprobante' => 'AI-'.date('YmdHi'),
                'proveedor_id' => $providerId,
                'bodega_id' => $bodegaId,
                'usuario_id' => $userId,
                'fecha_emision' => now(),
                'estado' => 'ordenada',
                'total_compra' => 0,
                'subtotal' => 0,
                'total_impuestos' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Crear Detalle
            $product = InvProducto::find($proposal->producto_id);
            $costo = $product->costo_promedio > 0 ? $product->costo_promedio : 1.00;
            $total = $proposal->cantidad_sugerida * $costo;
            // Calcular IVA (aprox)
            $subtotal = $total / 1.12;
            $impuesto = $total - $subtotal;

            DB::table('oper_compras_det')->insert([
                'compra_id' => $purchaseId,
                'producto_id' => $proposal->producto_id,
                'cantidad' => $proposal->cantidad_sugerida,
                'costo_unitario' => $costo,
                'subtotal' => $total,
            ]);

            // Actualizar total orden
            DB::table('oper_compras')->where('id', $purchaseId)->update([
                'total_compra' => $total,
                'subtotal' => $subtotal,
                'total_impuestos' => $impuesto,
            ]);

            // 3. Marcar propuesta como aprobada
            DB::table('com_propuestas_compra')
                ->where('id', $proposalId)
                ->update([
                    'estado' => 'aprobada',
                    'fecha_decision' => now(),
                    'orden_compra_generada_id' => $purchaseId,
                    'updated_at' => now(),
                ]);

            return $purchaseId;
        });
    }

    public function rejectProposal($proposalId)
    {
        DB::table('com_propuestas_compra')
            ->where('id', $proposalId)
            ->update([
                'estado' => 'rechazada',
                'fecha_decision' => now(),
                'updated_at' => now(),
            ]);
    }
}
