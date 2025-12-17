<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvBodegaProducto extends Model
{
    use HasFactory;

    protected $table = 'inv_bodega_producto';

    public $timestamps = false;

    protected $fillable = [
        'bodega_id',
        'producto_id',
        'existencia',
        'pasillo',
        'estante',
        'nivel',
    ];

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
