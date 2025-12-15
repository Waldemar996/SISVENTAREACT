<?php

namespace App\Services\Ventas;

use App\DTOs\Ventas\CrearVentaDTO;
use App\Models\Operaciones\OperVenta;
use App\Models\Operaciones\OperVentaDet;
use App\Models\Tesoreria\TesSesionCaja;
use App\Services\KardexService;
use App\Services\AuditService;
use App\EventSourcing\EventStore;
use App\EventSourcing\Events\Ventas\VentaCreadaEvent;
use App\EventSourcing\Events\Ventas\VentaAnuladaEvent;
use App\CQRS\Projectors\VentaProjector;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Service Layer para Ventas con Event Sourcing + CQRS
 * 
 * NUEVO: Event Sourcing + CQRS - nivel Google/Netflix/Amazon
 * - Event Sourcing: Auditoría perfecta + Time travel
 * - CQRS: Queries ultra-rápidas desde read model
 */
class VentaService
{
    public function __construct(
        private KardexService $kardexService,
        private AuditService $auditService,
        private EventStore $eventStore,
        private VentaProjector $projector  // ✅ NUEVO: CQRS Projector
    ) {}

    public function crear(CrearVentaDTO $dto): OperVenta
    {
        // Validaciones de negocio ANTES de la transacción
        $this->validarCajaAbierta($dto->sesionCajaId, $dto->usuarioId);
        $this->validarStockDisponible($dto);

        // Transacción SOLO para escrituras
        return DB::transaction(function () use ($dto) {
            // 1. Calcular totales
            $totales = $this->calcularTotales($dto);

            // 2. Crear venta
            $venta = $this->crearVenta($dto, $totales);

            // 3. Crear detalles y actualizar stock
            $this->procesarDetalles($venta, $dto);

            // 4. ✅ Event Sourcing: Emitir Domain Event
            $event = new VentaCreadaEvent(
                ventaId: $venta->id,
                clienteId: $venta->cliente_id,
                usuarioId: $venta->usuario_id,
                bodegaId: $venta->bodega_id,
                tipoComprobante: $venta->tipo_comprobante,
                numeroComprobante: $venta->numero_comprobante,
                formaPago: $venta->forma_pago,
                subtotal: $venta->subtotal_venta,
                descuentoTotal: $venta->descuento_total,
                impuestoTotal: $venta->impuesto_total,
                total: $venta->total_venta,
                detalles: $dto->detalles,
                observaciones: $venta->observaciones
            );
            $this->eventStore->append($event);

            // 5. ✅ CQRS: Proyectar al Read Model
            $this->projector->onVentaCreada($event);

            // 6. Auditoría (legacy - ahora tenemos Event Sourcing)
            $this->auditService->log('VENTAS', 'CREAR', $venta->id, [
                'numero' => $venta->numero_comprobante,
                'cliente_id' => $venta->cliente_id,
                'total' => $venta->total_venta
            ]);

            // 7. Limpiar cache del dashboard
            $this->limpiarCache($dto->usuarioId);

            return $venta->load(['detalles', 'cliente']);
        });
    }

    public function anular(int $ventaId, ?string $motivo = null): OperVenta
    {
        $venta = OperVenta::findOrFail($ventaId);

        // Validaciones
        if ($venta->estado === 'ANULADO') {
            throw new Exception('La venta ya está anulada');
        }

        return DB::transaction(function () use ($venta, $motivo) {
            // 1. Revertir stock
            $this->revertirStock($venta);

            // 2. Actualizar estado
            $venta->estado = 'ANULADO';
            $venta->fecha_anulacion = now();
            $venta->motivo_anulacion = $motivo;
            $venta->save();

            // 3. ✅ NUEVO: Emitir Domain Event
            $event = new VentaAnuladaEvent(
                ventaId: $venta->id,
                numeroComprobante: $venta->numero_comprobante,
                motivo: $motivo,
                anuladoPorUsuarioId: auth()->id()
            );
            $this->eventStore->append($event);

            // 4. Auditoría (legacy)
            $this->auditService->log('VENTAS', 'ANULAR', $venta->id, [
                'numero' => $venta->numero_comprobante,
                'motivo' => $motivo
            ]);

            // 5. Limpiar cache
            $this->limpiarCache($venta->usuario_id);

            return $venta;
        });
    }

    /**
     * Valida que haya una caja abierta
     */
    private function validarCajaAbierta(?int $sesionCajaId, ?int $usuarioId): void
    {
        if (!$sesionCajaId) {
            $sesionActiva = TesSesionCaja::where('usuario_id', $usuarioId)
                ->where('estado', 'ABIERTA')
                ->first();

            if (!$sesionActiva) {
                throw new Exception('No hay una sesión de caja abierta. Debe abrir caja antes de realizar ventas.');
            }
        }
    }

    /**
     * Valida que haya stock disponible para todos los productos
     */
    private function validarStockDisponible(CrearVentaDTO $dto): void
    {
        // Esta validación ya se hace en StockDisponibleRule
        // Pero la dejamos aquí como doble verificación
        foreach ($dto->detalles as $detalle) {
            $stock = DB::table('inv_bodega_producto')
                ->where('bodega_id', $dto->bodegaId ?? 1)
                ->where('producto_id', $detalle['producto_id'])
                ->value('existencia') ?? 0;

            if ($stock < $detalle['cantidad']) {
                $producto = DB::table('inv_productos')
                    ->where('id', $detalle['producto_id'])
                    ->value('nombre');
                    
                throw new Exception("Stock insuficiente para '{$producto}'. Disponible: {$stock}, Solicitado: {$detalle['cantidad']}");
            }
        }
    }

    /**
     * Calcula los totales de la venta
     */
    private function calcularTotales(CrearVentaDTO $dto): array
    {
        $subtotal = 0;
        $descuentoTotal = 0;
        $impuestoTotal = 0;

        foreach ($dto->detalles as $detalle) {
            $cantidad = $detalle['cantidad'];
            $precioUnitario = $detalle['precio_unitario'];
            $descuento = $detalle['descuento'] ?? 0;
            $impuesto = $detalle['impuesto'] ?? 0;

            $subtotalDetalle = $cantidad * $precioUnitario;
            $descuentoDetalle = $subtotalDetalle * ($descuento / 100);
            $baseImponible = $subtotalDetalle - $descuentoDetalle;
            $impuestoDetalle = $baseImponible * ($impuesto / 100);

            $subtotal += $subtotalDetalle;
            $descuentoTotal += $descuentoDetalle;
            $impuestoTotal += $impuestoDetalle;
        }

        // Descuento global
        $descuentoGlobal = $subtotal * ($dto->descuentoGlobal / 100);
        $descuentoTotal += $descuentoGlobal;

        $total = $subtotal - $descuentoTotal + $impuestoTotal;

        return [
            'subtotal' => round($subtotal, 2),
            'descuento_total' => round($descuentoTotal, 2),
            'impuesto_total' => round($impuestoTotal, 2),
            'total' => round($total, 2)
        ];
    }

    /**
     * Crea el registro de venta
     */
    private function crearVenta(CrearVentaDTO $dto, array $totales): OperVenta
    {
        return OperVenta::create([
            'cliente_id' => $dto->clienteId,
            'usuario_id' => $dto->usuarioId,
            'bodega_id' => $dto->bodegaId ?? 1,
            'sesion_caja_id' => $dto->sesionCajaId,
            'tipo_comprobante' => $dto->tipoComprobante,
            'numero_comprobante' => $dto->numeroComprobante ?? $this->generarNumeroComprobante($dto->tipoComprobante),
            'serie_comprobante' => $dto->serieComprobante,
            'fecha_emision' => now(),
            'forma_pago' => $dto->formaPago,
            'subtotal_venta' => $totales['subtotal'],
            'descuento_total' => $totales['descuento_total'],
            'impuesto_total' => $totales['impuesto_total'],
            'total_venta' => $totales['total'],
            'observaciones' => $dto->observaciones,
            'estado' => 'COMPLETADO'
        ]);
    }

    /**
     * Procesa los detalles de la venta y actualiza stock
     */
    private function procesarDetalles(OperVenta $venta, CrearVentaDTO $dto): void
    {
        foreach ($dto->detalles as $detalle) {
            // Crear detalle
            OperVentaDet::create([
                'venta_id' => $venta->id,
                'producto_id' => $detalle['producto_id'],
                'cantidad' => $detalle['cantidad'],
                'precio_unitario' => $detalle['precio_unitario'],
                'descuento' => $detalle['descuento'] ?? 0,
                'impuesto' => $detalle['impuesto'] ?? 0,
                'subtotal' => $detalle['cantidad'] * $detalle['precio_unitario'],
                'costo_unitario_historico' => $detalle['costo_unitario'] ?? 0
            ]);

            // Registrar movimiento en kardex (salida de stock)
            $this->kardexService->registrarMovimiento(
                bodegaId: $venta->bodega_id,
                productoId: $detalle['producto_id'],
                tipoMovimiento: 'venta',
                cantidad: $detalle['cantidad'],
                costoUnitario: $detalle['costo_unitario'] ?? 0,
                referencia: 'VENTA',
                referenciaId: $venta->id
            );
        }
    }

    /**
     * Revierte el stock de una venta anulada
     */
    private function revertirStock(OperVenta $venta): void
    {
        foreach ($venta->detalles as $detalle) {
            $this->kardexService->registrarMovimiento(
                bodegaId: $venta->bodega_id,
                productoId: $detalle->producto_id,
                tipoMovimiento: 'devolucion',
                cantidad: $detalle->cantidad,
                costoUnitario: $detalle->costo_unitario_historico,
                referencia: 'ANULACION_VENTA',
                referenciaId: $venta->id
            );
        }
    }

    /**
     * Genera un número de comprobante único
     */
    private function generarNumeroComprobante(string $tipoComprobante): string
    {
        $prefijo = match($tipoComprobante) {
            'FACTURA' => 'F',
            'BOLETA' => 'B',
            'TICKET' => 'T',
            default => 'V'
        };

        $ultimoNumero = OperVenta::where('tipo_comprobante', $tipoComprobante)
            ->whereYear('fecha_emision', now()->year)
            ->max('numero_comprobante');

        if ($ultimoNumero) {
            // Extraer el número y sumar 1
            $numero = (int) substr($ultimoNumero, -6) + 1;
        } else {
            $numero = 1;
        }

        return $prefijo . '-' . now()->year . '-' . str_pad($numero, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Limpia el cache del dashboard
     */
    private function limpiarCache(?int $usuarioId): void
    {
        if ($usuarioId) {
            cache()->forget('dashboard:stats:' . $usuarioId);
        }
    }
}
