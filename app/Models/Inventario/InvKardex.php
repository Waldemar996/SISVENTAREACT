<?php

namespace App\Models\Inventario;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Logistica\LogBodega;

class InvKardex extends Model
{
    use HasFactory;

    protected $table = 'inv_kardex';
    public $timestamps = false;

    protected $fillable = [
        'producto_id',
        'bodega_id',
        'tipo_movimiento',
        'cantidad',
        'costo_unitario',
        'costo_total',
        'stock_anterior',
        'stock_nuevo',
        'costo_promedio',
        'referencia_tipo',
        'referencia_id',
        'glosa',
        'fecha',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'costo_promedio' => 'decimal:2',
    ];

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }

    public function bodega()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_id');
    }
}
