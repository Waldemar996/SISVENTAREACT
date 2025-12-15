<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvCategoria extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inv_categorias';
    public $timestamps = false; // No timestamps in SQL script for this table

    protected $fillable = [
        'nombre',
        'categoria_padre_id',
    ];

    public function parent()
    {
        return $this->belongsTo(InvCategoria::class, 'categoria_padre_id');
    }

    public function children()
    {
        return $this->hasMany(InvCategoria::class, 'categoria_padre_id');
    }

    public function productos()
    {
        return $this->hasMany(InvProducto::class, 'categoria_id');
    }
}
