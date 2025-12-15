<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RRHH\SysUsuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SysUsuarioController extends Controller
{
    public function index()
    {
        // Listar usuarios con su empleado asociado si existe
        // Ocultando password_hash via Model hidden property
        return response()->json(
            SysUsuario::with('empleado')
                ->orderBy('id', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:sys_usuarios,username',
            'email' => 'required|email|max:100|unique:sys_usuarios,email',
            'password' => 'required|string|min:6',
            'rol' => 'required|string|in:superadmin,admin,vendedor,bodeguero,contador,rrhh',
            'empleado_id' => 'nullable|exists:rrhh_empleados,id'
        ]);

        $usuario = SysUsuario::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'rol' => $validated['rol'],
            'empleado_id' => $validated['empleado_id'] ?? null,
            'activo' => true
        ]);

        return response()->json(['message' => 'Usuario creado', 'data' => $usuario], 201);
    }

    public function update(Request $request, $id)
    {
        $usuario = SysUsuario::findOrFail($id);

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', Rule::unique('sys_usuarios')->ignore($usuario->id)],
            'email' => ['required', 'email', 'max:100', Rule::unique('sys_usuarios')->ignore($usuario->id)],
            'rol' => 'required|string|in:superadmin,admin,vendedor,bodeguero,contador,rrhh',
            'password' => 'nullable|string|min:6', // Opcional al editar
            'activo' => 'boolean'
        ]);

        $usuario->username = $validated['username'];
        $usuario->email = $validated['email'];
        $usuario->rol = $validated['rol'];
        if ($request->has('activo')) {
            $usuario->activo = $validated['activo'];
        }

        if ($request->filled('password')) {
            $usuario->password_hash = Hash::make($validated['password']);
        }

        $usuario->save();

        return response()->json(['message' => 'Usuario actualizado', 'data' => $usuario]);
    }

    /**
     * Remove the specified resource from storage.
     * Soft delete logic: just deactivating, or hard delete?
     * System users are critical, usually just deactivate. But standard destroy removes row.
     * We'll allow destroy but frontend should probably prefer deactivating.
     */
    public function destroy($id)
    {
        if (auth()->id() == $id) {
            return response()->json(['message' => 'No puedes eliminarte a ti mismo.'], 403);
        }
        
        $usuario = SysUsuario::findOrFail($id);
        $usuario->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }
}
