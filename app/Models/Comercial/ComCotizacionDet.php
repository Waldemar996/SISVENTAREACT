<?php

namespace App\Models\Comercial;

use App\Models\Inventario\InvProducto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComCotizacionDet extends Model
{
    use HasFactory;

    protected $table = 'com_cotizaciones_det';

    public $timestamps = false;

    protected $fillable = [
        'cotizacion_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function cotizacion()
    {
        return $this->belongsTo(ComCotizacion::class, 'cotizacion_id');
    }

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }
}
