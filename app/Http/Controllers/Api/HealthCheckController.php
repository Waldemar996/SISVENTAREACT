<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Health\HealthCheckService;

/**
 * Health Check Controller
 *
 * Endpoint: GET /api/health
 *
 * Para monitoring externo (Uptime Robot, Pingdom, etc.)
 */
class HealthCheckController extends Controller
{
    public function __construct(
        private HealthCheckService $healthCheck
    ) {}

    /**
     * Health check endpoint
     */
    public function index()
    {
        $health = $this->healthCheck->checkAll();

        $statusCode = $health['status'] === 'healthy' ? 200 : 503;

        return response()->json($health, $statusCode);
    }

    /**
     * Simple ping endpoint
     */
    public function ping()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
