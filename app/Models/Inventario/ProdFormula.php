<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProdFormula extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\SoftDeletes;

    protected $table = 'prod_formulas';
    public $timestamps = false;

    protected $fillable = [
        'producto_padre_id',
        'producto_hijo_id',
        'cantidad_requerida',
    ];

    protected $casts = [
        'cantidad_requerida' => 'decimal:4',
    ];

    public function productoPadre()
    {
        return $this->belongsTo(InvProducto::class, 'producto_padre_id');
    }

    public function productoHijo()
    {
        return $this->belongsTo(InvProducto::class, 'producto_hijo_id');
    }
}
