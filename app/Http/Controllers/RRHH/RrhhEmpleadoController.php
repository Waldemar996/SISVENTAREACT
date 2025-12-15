<?php

namespace App\Http\Controllers\RRHH;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RRHH\RrhhEmpleado;
use App\Models\RRHH\RrhhPuesto;

class RrhhEmpleadoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $empleados = RrhhEmpleado::with(['puesto.departamento'])->orderBy('apellidos')->get();
        return response()->json($empleados);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'codigo_empleado' => 'nullable|string|max:20',
            'email_personal' => 'nullable|email',
            'telefono' => 'nullable|string|max:20',
            'puesto_id' => 'required|exists:rrhh_puestos,id',
            'fecha_contratacion' => 'required|date',
            'estado' => 'required|in:activo,baja,suspension'
        ]);

        $empleado = RrhhEmpleado::create($validated);
        return response()->json(['message' => 'Empleado registrado', 'data' => $empleado], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $empleado = RrhhEmpleado::with(['puesto', 'usuario'])->findOrFail($id);
        return response()->json($empleado);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $empleado = RrhhEmpleado::findOrFail($id);
        $validated = $request->validate([
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email_personal' => 'nullable|email',
            'telefono' => 'nullable|string|max:20',
            'puesto_id' => 'required|exists:rrhh_puestos,id',
            'estado' => 'required|in:activo,baja,suspension'
        ]);

        $empleado->update($validated);
        return response()->json(['message' => 'Empleado actualizado', 'data' => $empleado]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $empleado = RrhhEmpleado::findOrFail($id);
        // Validar si tiene usuario asociado
        if ($empleado->usuario) {
            return response()->json(['message' => 'No se puede eliminar empleado con usuario de sistema asociado.'], 400);
        }
        $empleado->delete();
        return response()->json(['message' => 'Empleado eliminado']);
    }
}
