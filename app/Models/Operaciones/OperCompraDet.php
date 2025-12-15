<?php

namespace App\Models\Operaciones;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Inventario\InvProducto;
use App\Models\Inventario\InvLote;

class OperCompraDet extends Model
{
    use HasFactory;

    protected $table = 'oper_compras_det';
    public $timestamps = false;

    protected $fillable = [
        'compra_id',
        'producto_id',
        'lote_id',
        'cantidad',
        'costo_unitario',
        'subtotal',
    ];

    protected $casts = [
        'costo_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function compra()
    {
        return $this->belongsTo(OperCompra::class, 'compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(InvProducto::class, 'producto_id');
    }

    public function lote()
    {
        return $this->belongsTo(InvLote::class, 'lote_id');
    }
}
