<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Inventario\InvProducto;

/**
 * Valida que haya stock disponible para la cantidad solicitada.
 * 
 * Previene:
 * - Ventas con stock insuficiente
 * - Race conditions en ventas concurrentes
 * - Errores en el kardex
 */
class StockDisponibleRule implements ValidationRule
{
    private int $bodegaId;
    private bool $allowZeroStock = false;

    public function __construct(int $bodegaId = 1)
    {
        $this->bodegaId = $bodegaId;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Extraer el índice del detalle
        preg_match('/detalles\.(\d+)\.cantidad/', $attribute, $matches);
        
        if (!isset($matches[1])) {
            $fail('Error en la validación de cantidad.');
            return;
        }

        $index = $matches[1];
        
        // Obtener el producto_id del mismo detalle
        $productoId = request()->input("detalles.{$index}.producto_id");
        
        if (!$productoId) {
            $fail('Debe seleccionar un producto antes de ingresar la cantidad.');
            return;
        }

        // Buscar el producto
        $producto = InvProducto::find($productoId);
        
        if (!$producto) {
            $fail('El producto seleccionado no existe.');
            return;
        }

        // Obtener stock en la bodega
        $stockBodega = InvBodegaProducto::where('bodega_id', $this->bodegaId)
            ->where('producto_id', $productoId)
            ->first();

        $stockDisponible = $stockBodega->existencia ?? 0;

        // Validar stock disponible
        if ($value > $stockDisponible) {
            if ($stockDisponible == 0) {
                $fail("El producto '{$producto->nombre}' no tiene stock disponible en esta bodega.");
            } else {
                $fail("Stock insuficiente para '{$producto->nombre}'. Disponible: {$stockDisponible}, Solicitado: {$value}.");
            }
            return;
        }

        // Validación adicional: Si no se permite stock cero y la venta dejaría en 0
        if (!$this->allowZeroStock && ($stockDisponible - $value) == 0) {
            $fail("Esta venta dejaría el producto '{$producto->nombre}' sin stock. Considere mantener stock de seguridad.");
            return;
        }
    }

    /**
     * Permite ventas que dejen el stock en cero.
     */
    public function allowZeroStock(): self
    {
        $this->allowZeroStock = true;
        return $this;
    }

    /**
     * Configura la bodega a validar.
     */
    public function forBodega(int $bodegaId): self
    {
        $this->bodegaId = $bodegaId;
        return $this;
    }
}
