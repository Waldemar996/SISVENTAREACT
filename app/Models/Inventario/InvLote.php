<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvLote extends Model
{
    use HasFactory;

    protected $table = 'inv_lotes';

    public $timestamps = false; // Based on SQL

    protected $fillable = [
        'producto_id',
        'codigo_lote',
        'fecha_fabricacion',
        'fecha_vencimiento',
        'estado',
    ];

    protected $casts = [
        'fecha_fabricacion' => 'date',
        'fecha_vencimiento' => 'date',
    ];

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
