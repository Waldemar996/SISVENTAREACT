<?php

namespace App\Infrastructure\Persistence;

use App\Domain\Inventory\Repositories\KardexRepositoryInterface;
use App\Models\Inventario\InvBodegaProducto;
use App\Services\KardexService;

class EloquentKardexRepository implements KardexRepositoryInterface
{
    protected $legacyService;

    public function __construct(KardexService $legacyService)
    {
        $this->legacyService = $legacyService;
    }

    public function getStock(int $bodegaId, int $productoId): float
    {
        return InvBodegaProducto::where('bodega_id', $bodegaId)
            ->where('producto_id', $productoId)
            ->value('existencia') ?? 0.0;
    }

    public function registerMovement(int $bodegaId, int $productoId, string $tipo, float $cantidad, float $costo, string $referencia = '', ?int $referenciaId = null): void
    {
        // Bridge to Legacy Service until we fully refactor logic to Domain
        $this->legacyService->registrarMovimiento(
            $bodegaId,
            $productoId,
            $tipo,
            $cantidad,
            $costo,
            $referencia,
            $referenciaId
        );
    }
}
