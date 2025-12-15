<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request Logger Middleware
 * 
 * Logs todas las requests para:
 * - Debugging
 * - Analytics
 * - Security auditing
 */
class RequestLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = (microtime(true) - $startTime) * 1000; // ms

        // Log solo en desarrollo o para requests lentas
        if (app()->environment('local') || $duration > 1000) {
            Log::info('HTTP Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'status' => $response->getStatusCode(),
                'duration_ms' => round($duration, 2),
                'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2)
            ]);
        }

        // Header con tiempo de respuesta
        $response->headers->set('X-Response-Time', round($duration, 2) . 'ms');

        return $response;
    }
}
