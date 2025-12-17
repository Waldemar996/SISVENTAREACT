<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Comercial\ComCliente;
use Illuminate\Http\Request;

class ComClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $clientes = ComCliente::orderBy('razon_social')->get();

        return response()->json($clientes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:200',
            'nit' => 'nullable|string|max:20|unique:com_clientes',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'limite_credito' => 'numeric|min:0',
            'dias_credito' => 'integer|min:0',
        ]);

        $cliente = ComCliente::create($validated);

        return response()->json(['message' => 'Cliente registrado exitosamente', 'data' => $cliente], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $cliente = ComCliente::findOrFail($id);

        return response()->json($cliente);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $cliente = ComCliente::findOrFail($id);

        $validated = $request->validate([
            'razon_social' => 'required|string|max:200',
            'nit' => 'nullable|string|max:20|unique:com_clientes,nit,'.$id,
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:100',
            'limite_credito' => 'numeric|min:0',
            'dias_credito' => 'integer|min:0',
        ]);

        $cliente->update($validated);

        return response()->json(['message' => 'Cliente actualizado', 'data' => $cliente]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $cliente = ComCliente::findOrFail($id);
        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado']);
    }
}
