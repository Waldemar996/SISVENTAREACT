<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $user = Auth::user();

        // El SuperAdmin siempre pasa, es el "Dios" del sistema
        if ($user->rol === 'superadmin') {
            return $next($request);
        }

        // Si el rol del usuario está en la lista de roles permitidos para esta ruta
        if (in_array($user->rol, $roles)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Acceso no autorizado. Tu rol (' . $user->rol . ') no tiene permisos para esta acción.'
        ], 403);
    }
}
