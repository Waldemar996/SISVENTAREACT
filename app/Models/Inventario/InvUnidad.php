<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvUnidad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inv_unidades';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'abreviatura',
    ];

    public function productos()
    {
        return $this->hasMany(InvProducto::class, 'unidad_id');
    }
}
