<?php

namespace App\Models\Operaciones;

use App\Models\Inventario\InvProducto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperDevolucionDet extends Model
{
    use HasFactory;

    protected $table = 'oper_devoluciones_det';

    public $timestamps = false;

    protected $fillable = [
        'devolucion_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'estado_fisico',
    ];

    public function devolucion()
    {
        return $this->belongsTo(OperDevolucion::class, 'devolucion_id');
    }

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
