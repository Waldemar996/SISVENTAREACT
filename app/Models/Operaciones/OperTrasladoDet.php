<?php

namespace App\Models\Operaciones;

use App\Models\Inventario\InvProducto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperTrasladoDet extends Model
{
    use HasFactory;

    protected $table = 'oper_traslados_det';

    public $timestamps = false;

    protected $fillable = [
        'traslado_id',
        'producto_id',
        'cantidad_enviada',
        'cantidad_recibida',
    ];

    public function traslado()
    {
        return $this->belongsTo(OperTraslado::class, 'traslado_id');
    }

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
