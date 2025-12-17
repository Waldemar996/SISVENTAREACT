<?php

namespace App\Models\Inventario;

use App\Models\Logistica\LogBodega;
use App\Models\Operaciones\OperCompra;
use App\Models\Operaciones\OperVenta;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvSerie extends Model
{
    use HasFactory;

    protected $table = 'inv_series';
    // Has timestamps

    protected $fillable = [
        'producto_id',
        'bodega_id',
        'numero_serie',
        'compra_id',
        'venta_id',
        'estado',
    ];

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }

    public function bodega()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_id');
    }

    public function compra()
    {
        return $this->belongsTo(OperCompra::class, 'compra_id');
    }

    public function venta()
    {
        return $this->belongsTo(OperVenta::class, 'venta_id');
    }
}
