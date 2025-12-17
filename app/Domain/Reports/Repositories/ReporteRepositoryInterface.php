<?php

namespace App\Domain\Reports\Repositories;

use Carbon\Carbon;

interface ReporteRepositoryInterface
{
    /**
     * Get daily sales report within a date range.
     * Returns an array of ReporteVentasDTO.
     */
    public function getVentasDiarias(Carbon $fechaInicio, Carbon $fechaFin): array;
}
