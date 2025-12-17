<?php

namespace App\CQRS\Projectors;

use App\EventSourcing\Events\Ventas\VentaAnuladaEvent;
use App\EventSourcing\Events\Ventas\VentaCreadaEvent;
use Illuminate\Support\Facades\DB;

/**
 * Projector - Actualiza el Read Model cuando hay eventos
 *
 * Patrón: Event-Driven CQRS
 *
 * Cuando se crea/anula una venta:
 * 1. Se emite un evento
 * 2. El projector escucha el evento
 * 3. Actualiza el read model
 *
 * Resultado: Read model siempre sincronizado
 */
class VentaProjector
{
    /**
     * Proyecta VentaCreadaEvent al read model
     */
    public function onVentaCreada(VentaCreadaEvent $event): void
    {
        // Obtener datos adicionales
        $venta = DB::table('oper_ventas')->find($event->ventaId);
        $cliente = DB::table('com_clientes')->find($event->clienteId);
        $usuario = DB::table('sys_usuarios')->find($event->usuarioId);
        $bodega = DB::table('log_bodegas')->find($event->bodegaId);

        // Obtener productos
        $detalles = DB::table('oper_ventas_det')
            ->join('inv_productos', 'oper_ventas_det.producto_id', '=', 'inv_productos.id')
            ->where('oper_ventas_det.venta_id', $event->ventaId)
            ->select(
                'inv_productos.id',
                'inv_productos.nombre',
                'inv_productos.codigo_sku',
                'oper_ventas_det.cantidad',
                'oper_ventas_det.precio_unitario',
                'oper_ventas_det.subtotal'
            )
            ->get();

        // Insertar en read model
        DB::table('ventas_read_model')->insert([
            'venta_id' => $event->ventaId,
            'numero_comprobante' => $event->numeroComprobante,
            'tipo_comprobante' => $event->tipoComprobante,
            'estado' => 'COMPLETADO',

            // Cliente
            'cliente_id' => $event->clienteId,
            'cliente_nombre' => $cliente->razon_social ?? 'N/A',
            'cliente_nit' => $cliente->nit ?? 'CF',

            // Usuario
            'usuario_id' => $event->usuarioId,
            'usuario_nombre' => $usuario->username ?? 'N/A',

            // Fechas
            'fecha_venta' => now()->toDateString(),
            'fecha_emision' => now(),

            // Montos
            'subtotal' => $event->subtotal,
            'descuento' => $event->descuentoTotal,
            'impuesto' => $event->impuestoTotal,
            'total' => $event->total,

            // Forma de pago
            'forma_pago' => $event->formaPago,

            // Productos (JSON)
            'productos' => json_encode($detalles),
            'cantidad_items' => $detalles->count(),
            'cantidad_total_productos' => $detalles->sum('cantidad'),

            // Metadata
            'bodega_nombre' => $bodega->nombre ?? 'N/A',
            'observaciones' => $event->observaciones,

            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Proyecta VentaAnuladaEvent al read model
     */
    public function onVentaAnulada(VentaAnuladaEvent $event): void
    {
        DB::table('ventas_read_model')
            ->where('venta_id', $event->ventaId)
            ->update([
                'estado' => 'ANULADO',
                'fecha_anulacion' => now(),
                'motivo_anulacion' => $event->motivo,
                'updated_at' => now(),
            ]);
    }

    /**
     * Reconstruye TODO el read model desde eventos
     *
     * Útil para:
     * - Migración inicial
     * - Recuperación de desastres
     * - Cambios en el schema del read model
     */
    public function rebuild(): void
    {
        // Limpiar read model
        DB::table('ventas_read_model')->truncate();

        // Obtener TODOS los eventos de ventas
        $eventos = DB::table('event_store')
            ->where('aggregate_type', 'venta')
            ->orderBy('occurred_at')
            ->get();

        foreach ($eventos as $row) {
            $eventClass = $row->event_type;
            $eventData = json_decode($row->event_data, true);
            $metadata = json_decode($row->metadata, true);

            $event = $eventClass::fromArray($eventData, $metadata);

            // Proyectar según tipo de evento
            if ($event instanceof VentaCreadaEvent) {
                $this->onVentaCreada($event);
            } elseif ($event instanceof VentaAnuladaEvent) {
                $this->onVentaAnulada($event);
            }
        }
    }
}
