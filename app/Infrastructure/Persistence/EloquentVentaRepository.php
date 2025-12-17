<?php

namespace App\Infrastructure\Persistence;

use App\Domain\Sales\Entities\Venta;
use App\Domain\Sales\Repositories\VentaRepositoryInterface;
use App\Models\Operaciones\OperVenta;
use Illuminate\Support\Facades\DB;

class EloquentVentaRepository implements VentaRepositoryInterface
{
    public function save(Venta $venta): Venta
    {
        // Start mapping Domain Entity to Eloquent Model
        $model = new OperVenta;
        $model->cliente_id = $venta->getClienteId();
        $model->tipo_comprobante = 'FACTURA'; // Default for now
        $model->numero_comprobante = 'V-'.time(); // Basic generation
        $model->fecha_emision = now();
        // $model->metodo_pago = $venta->getMetodoPago(); // Column does not exist in current schema
        $model->estado = $venta->getEstado();
        $model->total_venta = $venta->getTotal()->getMonto();

        // These fields are required by DB schema but not yet in Domain Entity (Simplified for Phase 3)
        $model->usuario_id = auth()->id() ?? 1; // Fallback for test
        $model->bodega_id = $venta->getBodegaId();
        $model->sesion_caja_id = $venta->getSesionCajaId();
        $model->subtotal = $venta->getTotal()->getMonto() / 1.12; // Approx validation
        $model->total_impuestos = $venta->getTotal()->getMonto() - $model->subtotal;
        $model->descuento = 0;

        $model->save();
        $venta->setId($model->id);

        // Save Details
        foreach ($venta->getDetalles() as $detalle) {
            $model->detalles()->create([
                'producto_id' => $detalle->getProductoId(),
                'cantidad' => $detalle->getCantidad(),
                'precio_unitario' => $detalle->getPrecioUnitario()->getMonto(),
                'subtotal' => $detalle->getSubtotal()->getMonto(),
                // Defaults
                'impuesto_aplicado' => 0,
                'costo_unitario_historico' => 0,
            ]);
        }

        return $venta;
    }

    public function findById(int $id): ?Venta
    {
        // Conversion from Eloquent to Domain Entity would go here
        // For 'Create Flow', this is less critical immediately but needed for auditing/updates.
        return null;
    }
}
