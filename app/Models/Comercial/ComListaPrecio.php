<?php

namespace App\Models\Comercial;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComListaPrecio extends Model
{
    use HasFactory;

    protected $table = 'com_listas_precios';
    public $timestamps = false;

    protected $fillable = ['nombre', 'activo'];
    
    protected $casts = [
        'activo' => 'boolean'
    ];
}
