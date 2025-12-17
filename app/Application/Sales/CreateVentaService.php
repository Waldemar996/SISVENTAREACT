<?php

namespace App\Application\Sales;

use App\Domain\Sales\Entities\Venta;
use App\Domain\Sales\Entities\VentaDetalle;
use App\Domain\Sales\Repositories\VentaRepositoryInterface;
use App\Domain\Sales\ValueObjects\Dinero;

class CreateVentaService
{
    private VentaRepositoryInterface $repository;

    private \App\Domain\Inventory\Repositories\KardexRepositoryInterface $kardexRepository;

    private \App\Domain\Inventory\Services\StockValidationService $stockValidationService;

    public function __construct(
        VentaRepositoryInterface $repository,
        \App\Domain\Inventory\Repositories\KardexRepositoryInterface $kardexRepository,
        \App\Domain\Inventory\Services\StockValidationService $stockValidationService
    ) {
        $this->repository = $repository;
        $this->kardexRepository = $kardexRepository;
        $this->stockValidationService = $stockValidationService;
    }

    public function execute(CreateVentaDTO $dto): Venta
    {
        // 1. Transaction is handled by Middleware, but for safety inside logic we can verify
        // 2. Create Domain Entity
        $venta = new Venta($dto->clienteId, $dto->bodegaId, $dto->sesionCajaId, $dto->metodoPago);

        // 3. Add Items & Validate Stock
        foreach ($dto->items as $item) {
            // Strict Stock Validation
            $this->stockValidationService->checkAvailability(
                $venta->getBodegaId(),
                $item['producto_id'],
                (float) $item['cantidad']
            );

            // Mock Price (Ideally Fetch Product Entity)
            $precio = new Dinero((float) $item['precio_unitario']);

            $detalle = new VentaDetalle(
                $item['producto_id'],
                $item['cantidad'],
                $precio
            );
            $venta->agregarDetalle($detalle);
        }

        // 4. Confirm Sale
        $venta->confirmar();

        // 5. Persist Sale
        $savedVenta = $this->repository->save($venta);

        // 6. Update Inventory (Kardex) via Repository
        foreach ($dto->items as $item) {
            $this->kardexRepository->registerMovement(
                $venta->getBodegaId(),
                $item['producto_id'],
                'venta',
                $item['cantidad'],
                0, // Costo Unitario (Legacy Service calculates it)
                'VENTA',
                $savedVenta->getId()
            );
        }

        // 7. Dispatch Domain Event (Accounting Integration)
        \App\Domain\Sales\Events\VentaConfirmed::dispatch(
            $savedVenta->getId(),
            $savedVenta->getTotal()->getMonto(),
            $savedVenta->getBodegaId()
        );

        return $savedVenta;
    }
}
