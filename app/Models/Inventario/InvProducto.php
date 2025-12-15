<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Finanzas\FinTipoImpuesto; // New model needed

class InvProducto extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inv_productos';

    protected $fillable = [
        'codigo_sku',
        'codigo_barras_fabricante',
        'nombre',
        'descripcion_corta',
        'descripcion_detallada',
        'categoria_id',
        'marca_id',
        'unidad_id',
        'tipo', // producto_terminado, materia_prima, servicio, kit
        'controla_stock',
        'usa_lotes',
        'usa_series',
        'costo_promedio',
        'precio_venta_base', // Before tax
        'precio_mayoreo',
        'impuesto_porcentaje', // Cached value
        'impuesto_id', // Relationship
        'stock_minimo',
        'stock_maximo',
        'imagen_principal_url',
        'activo'
    ];

    protected $casts = [
        'controla_stock' => 'boolean',
        'usa_lotes' => 'boolean',
        'usa_series' => 'boolean',
        'activo' => 'boolean',
        'costo_promedio' => 'decimal:2',
        'precio_venta_base' => 'decimal:2',
        'impuesto_porcentaje' => 'decimal:2',
    ];

    public function categoria()
    {
        return $this->belongsTo(\App\Models\Inventario\InvCategoria::class, 'categoria_id');
    }

    public function marca()
    {
        return $this->belongsTo(\App\Models\Inventario\InvMarca::class, 'marca_id');
    }

    public function unidad()
    {
        return $this->belongsTo(\App\Models\Inventario\InvUnidad::class, 'unidad_id');
    }
    
    public function impuesto()
    {
        return $this->belongsTo(\App\Models\Finanzas\FinTipoImpuesto::class, 'impuesto_id');
    }

    public function bodegaProductos()
    {
        return $this->hasMany(\App\Models\Inventario\InvBodegaProducto::class, 'producto_id');
    }
    protected $appends = ['stock_total'];

    public function getStockTotalAttribute()
    {
        return $this->bodegaProductos()->sum('existencia') ?? 0;
    }
}
