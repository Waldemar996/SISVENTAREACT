<?php

namespace App\Http\Controllers\Inventario;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProdFormulaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Devolver productos que tienen fórmula definida (cabeceras)
        $formulas = \App\Models\Inventario\ProdFormula::select('producto_padre_id')
            ->distinct()
            ->with(['productoPadre', 'productoPadre.marca']) // Cargar datos del producto final
            ->get()
            ->map(function ($item) {
                // Para cada producto padre, cargamos sus componentes (esto podría optimizarse pero funciona para MVP)
                $componentes = \App\Models\Inventario\ProdFormula::with('productoHijo')
                    ->where('producto_padre_id', $item->producto_padre_id)
                    ->get();
                
                return [
                    'id' => $item->producto_padre_id, // Usamos ID del producto como ID de la 'fórmula' visual
                    'producto' => $item->productoPadre,
                    'cantidad_producir' => 1, // Default base
                    'componentes_count' => $componentes->count(),
                    'componentes' => $componentes
                ];
            });

        return response()->json(['data' => $formulas]);
    }

    public function store(Request $request)
    {
        // Validación para estructura de "Receta Completa"
        if ($request->has('componentes')) {
            $validated = $request->validate([
                'producto_id' => 'required|exists:inv_productos,id',
                'componentes' => 'required|array|min:1',
                'componentes.*.producto_componente_id' => 'required|exists:inv_productos,id|different:producto_id',
                'componentes.*.cantidad_necesaria' => 'required|numeric|min:0.0001',
            ]);

            $padreId = $validated['producto_id'];
            $creados = [];

            // Limpiar fórmula anterior si se desea reemlazar completamente (opcional, por ahora agregamos/actualizamos)
            // \App\Models\Inventario\ProdFormula::where('producto_padre_id', $padreId)->delete(); 

            foreach ($validated['componentes'] as $comp) {
                // Update or Create para cada ingrediente
                $formula = \App\Models\Inventario\ProdFormula::updateOrCreate(
                    [
                        'producto_padre_id' => $padreId,
                        'producto_hijo_id' => $comp['producto_componente_id']
                    ],
                    [
                        'cantidad_requerida' => $comp['cantidad_necesaria']
                    ]
                );
                $creados[] = $formula;
            }

            return response()->json(['message' => 'Fórmula guardada correctamente', 'formulas' => $creados], 201);
        }

        // Fallback para inserción simple (legacy o API directa)
        $validated = $request->validate([
            'producto_padre_id' => 'required|exists:inv_productos,id',
            'producto_hijo_id' => 'required|exists:inv_productos,id|different:producto_padre_id',
            'cantidad_requerida' => 'required|numeric|min:0.0001',
        ]);

        $exists = \App\Models\Inventario\ProdFormula::where('producto_padre_id', $validated['producto_padre_id'])
                    ->where('producto_hijo_id', $validated['producto_hijo_id'])
                    ->first();

        if ($exists) {
            return response()->json(['message' => 'Este insumo ya existe en la fórmula'], 422);
        }

        $formula = \App\Models\Inventario\ProdFormula::create($validated);
        return response()->json($formula, 201);
    }

    public function destroy(string $id)
    {
        // El $id que recibimos es realmente el producto_padre_id (ver método index)
        // Borramos TODOS los ingredientes de esa fórmula (Soft Delete)
        \App\Models\Inventario\ProdFormula::where('producto_padre_id', $id)->delete();
        return response()->json(['message' => 'Fórmula eliminada correctamente']);
    }
}
