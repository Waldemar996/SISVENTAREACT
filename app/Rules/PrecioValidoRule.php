<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\Inventario\InvProducto;

/**
 * Valida que el precio de venta sea válido según el precio base del producto.
 * 
 * Reglas:
 * - El precio no puede ser menor al 50% del precio base (previene ventas a pérdida)
 * - El precio no puede ser mayor al 500% del precio base (previene errores de digitación)
 * - Previene fraude y errores humanos
 */
class PrecioValidoRule implements ValidationRule
{
    private float $minPercentage = 0.5;  // 50% del precio base
    private float $maxPercentage = 5.0;  // 500% del precio base

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Extraer el índice del detalle desde el attribute
        // Ejemplo: "detalles.0.precio_unitario" -> índice 0
        preg_match('/detalles\.(\d+)\.precio_unitario/', $attribute, $matches);
        
        if (!isset($matches[1])) {
            $fail('Error en la validación del precio.');
            return;
        }

        $index = $matches[1];
        
        // Obtener el producto_id del mismo detalle
        $productoId = request()->input("detalles.{$index}.producto_id");
        
        if (!$productoId) {
            $fail('Debe seleccionar un producto antes de ingresar el precio.');
            return;
        }

        // Buscar el producto
        $producto = InvProducto::find($productoId);
        
        if (!$producto) {
            $fail('El producto seleccionado no existe.');
            return;
        }

        // Validar que el producto tenga precio base configurado
        if (!$producto->precio_venta_base || $producto->precio_venta_base <= 0) {
            $fail("El producto '{$producto->nombre}' no tiene precio base configurado.");
            return;
        }

        $precioBase = $producto->precio_venta_base;
        $precioMinimo = $precioBase * $this->minPercentage;
        $precioMaximo = $precioBase * $this->maxPercentage;

        // Validar rango
        if ($value < $precioMinimo) {
            $fail("El precio no puede ser menor a Q" . number_format($precioMinimo, 2) . 
                  " (50% del precio base de Q" . number_format($precioBase, 2) . ").");
            return;
        }

        if ($value > $precioMaximo) {
            $fail("El precio no puede ser mayor a Q" . number_format($precioMaximo, 2) . 
                  " (500% del precio base de Q" . number_format($precioBase, 2) . "). Verifique si ingresó el precio correctamente.");
            return;
        }
    }

    /**
     * Permite configurar el porcentaje mínimo permitido.
     */
    public function withMinPercentage(float $percentage): self
    {
        $this->minPercentage = $percentage;
        return $this;
    }

    /**
     * Permite configurar el porcentaje máximo permitido.
     */
    public function withMaxPercentage(float $percentage): self
    {
        $this->maxPercentage = $percentage;
        return $this;
    }
}
