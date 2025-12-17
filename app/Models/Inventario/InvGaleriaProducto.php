<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvGaleriaProducto extends Model
{
    use HasFactory;

    protected $table = 'inv_galeria_productos';

    public $timestamps = false;

    protected $fillable = [
        'producto_id',
        'url_imagen',
        'orden',
    ];

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
