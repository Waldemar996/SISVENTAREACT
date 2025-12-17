<?php

namespace App\Http\Middleware;

use App\Domain\Security\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! Auth::check()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $user = Auth::user();

        // Ensure user has a role attribute, otherwise fail safe
        $role = $user->rol ?? 'guest';

        if (PermissionService::hasPermission($role, $permission)) {
            return $next($request);
        }

        return response()->json([
            'message' => "Acceso denegado. Se requiere el permiso: {$permission}",
            'rol_actual' => $role,
        ], 403);
    }
}
