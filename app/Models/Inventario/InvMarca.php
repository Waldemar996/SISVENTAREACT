<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvMarca extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inv_marcas';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'pais',
    ];

    public function productos()
    {
        return $this->hasMany(InvProducto::class, 'marca_id');
    }
}
