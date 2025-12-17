<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security Headers Middleware
 *
 * Agrega headers de seguridad recomendados por OWASP
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Previene clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Previene MIME sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // XSS Protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Content Security Policy
        $response->headers->set('Content-Security-Policy',
            "default-src 'self'; ".
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; ".
            "style-src 'self' 'unsafe-inline'; ".
            "img-src 'self' data: https:; ".
            "font-src 'self' data:; ".
            "connect-src 'self'"
        );

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        $response->headers->set('Permissions-Policy',
            'geolocation=(), microphone=(), camera=()'
        );

        // HSTS (solo en producción con HTTPS)
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
