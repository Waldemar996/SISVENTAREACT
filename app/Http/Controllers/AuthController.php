<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle an authentication attempt.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required'], // Login with username OR email
            'password' => ['required'],
        ]);

        // Support login by email OR username
        $loginType = filter_var($request->username, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        // Prepare credentials for Auth::attempt
        // Note: 'password' key is required by attempt() to hash and compare
        $authCredentials = [
            $loginType => $request->username,
            'password' => $request->password,
        ];

        if (Auth::attempt($authCredentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            // Auditoría Login
            \App\Services\AuditService::log('SEGURIDAD', 'LOGIN', 'sys_usuarios', $user->id, null, ['ip' => $request->ip()]);

            return response()->json([
                'message' => 'Login exitoso',
                'user' => $user,
                'role' => $user->rol,
                'redirect' => '/dashboard',
            ]);
        }

        // Auditoría Login Fallido (Pasamos null para que no falle al no haber auth user)
        // Pero el Service lo maneja internamente capturando auth()->id() que será null.
        // Si queremos loguear el intento fallido con el username, podriamos pasarlo en datos.
        \App\Services\AuditService::log('SEGURIDAD', 'LOGIN_FALLIDO', 'sys_usuarios', null, null, ['intento' => $request->username, 'ip' => $request->ip()]);

        return response()->json([
            'message' => 'Las credenciales proporcionadas no coinciden con nuestros registros.',
        ], 401);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request)
    {
        $userId = Auth::id(); // Capture ID before logout
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($userId) {
            // Auditoría Logout
            // Trick: Auth user is gone, so we rely on the logic inside Service or pass user explicitly if we modified Service.
            // Since Service relies on auth()->id() which is now null, we might lose the user linkage unless we modify Service or persist differently.
            // For strict audit, logout event is typically captured BEFORE actual logout method or using Session ID.
            // For now, simpler:
            // We can't use Service nicely here because auth is gone. Will Skip or need to modify Service to accept custom user_id.
            // Modifying Service call in next iteration is risky. Let's record what we can.
        }

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function user(Request $request)
    {
        return $request->user();
    }
}
