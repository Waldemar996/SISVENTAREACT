<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Advanced API Rate Limiting
 * 
 * Protección contra:
 * - Brute force attacks
 * - API abuse
 * - DDoS
 * 
 * Nivel: Enterprise
 */
class AdvancedRateLimiter
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $tier = 'default'): Response
    {
        $key = $this->resolveRequestSignature($request);

        // Configuración por tier
        $limits = $this->getLimitsForTier($tier);

        // Rate limiting con Redis
        $executed = RateLimiter::attempt(
            $key,
            $limits['maxAttempts'],
            function() use ($next, $request) {
                return $next($request);
            },
            $limits['decaySeconds']
        );

        if (!$executed) {
            // Log intento de abuso
            $this->logAbuse($request, $key);

            // Bloqueo temporal si hay muchos intentos
            if ($this->shouldBlockTemporarily($key)) {
                $this->blockTemporarily($key);
                return response()->json([
                    'error' => 'Too many requests. Your IP has been temporarily blocked.',
                    'retry_after' => 3600
                ], 429);
            }

            return response()->json([
                'error' => 'Too many requests. Please slow down.',
                'retry_after' => RateLimiter::availableIn($key)
            ], 429);
        }

        // Headers informativos
        $response = $executed;
        $response->headers->set('X-RateLimit-Limit', $limits['maxAttempts']);
        $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($key, $limits['maxAttempts']));

        return $response;
    }

    /**
     * Genera key única por usuario/IP
     */
    private function resolveRequestSignature(Request $request): string
    {
        if ($user = $request->user()) {
            return 'rate-limit:user:' . $user->id;
        }

        return 'rate-limit:ip:' . $request->ip();
    }

    /**
     * Límites por tier
     */
    private function getLimitsForTier(string $tier): array
    {
        return match($tier) {
            'strict' => [
                'maxAttempts' => 10,
                'decaySeconds' => 60
            ],
            'api' => [
                'maxAttempts' => 60,
                'decaySeconds' => 60
            ],
            'default' => [
                'maxAttempts' => 100,
                'decaySeconds' => 60
            ],
            'premium' => [
                'maxAttempts' => 1000,
                'decaySeconds' => 60
            ],
        };
    }

    /**
     * Log intentos de abuso
     */
    private function logAbuse(Request $request, string $key): void
    {
        $abuseKey = "abuse:{$key}";
        $attempts = Cache::increment($abuseKey);

        if ($attempts === 1) {
            Cache::put($abuseKey, 1, 3600); // 1 hora
        }

        \Log::warning('Rate limit exceeded', [
            'key' => $key,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'path' => $request->path(),
            'attempts' => $attempts
        ]);
    }

    /**
     * Decide si bloquear temporalmente
     */
    private function shouldBlockTemporarily(string $key): bool
    {
        $abuseKey = "abuse:{$key}";
        $attempts = Cache::get($abuseKey, 0);

        return $attempts > 10; // Más de 10 rate limits en 1 hora
    }

    /**
     * Bloquea temporalmente
     */
    private function blockTemporarily(string $key): void
    {
        $blockKey = "blocked:{$key}";
        Cache::put($blockKey, true, 3600); // 1 hora

        \Log::alert('IP/User temporarily blocked', [
            'key' => $key,
            'duration' => '1 hour'
        ]);
    }
}
