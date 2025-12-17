<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Comercial\ComProveedor;
use Illuminate\Http\Request;

class ComProveedorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Removed 'activo' filter as column does not exist
        $proveedores = ComProveedor::orderBy('razon_social')->get();

        return response()->json($proveedores);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:200',
            'nit' => 'nullable|string|max:20',
            'nombre_contacto' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
        ]);

        $proveedor = ComProveedor::create($validated);

        return response()->json(['message' => 'Proveedor registrado', 'data' => $proveedor], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $proveedor = ComProveedor::findOrFail($id);

        return response()->json($proveedor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $proveedor = ComProveedor::findOrFail($id);

        $validated = $request->validate([
            'razon_social' => 'required|string|max:200',
            'nit' => 'nullable|string|max:20',
            'nombre_contacto' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
        ]);

        $proveedor->update($validated);

        return response()->json(['message' => 'Proveedor actualizado', 'data' => $proveedor]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $proveedor = ComProveedor::findOrFail($id);
        // Soft Delete (trait added to Model)
        $proveedor->delete();

        return response()->json(['message' => 'Proveedor eliminado']);
    }
}
