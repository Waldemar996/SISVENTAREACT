<?php

namespace App\Models\Inventario;

use App\Models\Logistica\LogBodega;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProdOrdenDet extends Model
{
    use HasFactory;

    protected $table = 'prod_ordenes_det';

    public $timestamps = false;

    protected $fillable = [
        'orden_id',
        'producto_insumo_id',
        'bodega_origen_id',
        'cantidad_solicitada',
        'cantidad_consumida',
        'costo_unitario',
        'subtotal',
    ];

    protected $casts = [
        'cantidad_solicitada' => 'decimal:4',
        'cantidad_consumida' => 'decimal:4',
        'costo_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function orden()
    {
        return $this->belongsTo(ProdOrden::class, 'orden_id');
    }

    public function productoInsumo()
    {
        return $this->belongsTo(InvProducto::class, 'producto_insumo_id');
    }

    public function bodegaOrigen()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_origen_id');
    }
}
