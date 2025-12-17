<?php

namespace App\Models\Operaciones;

use App\Models\Inventario\InvLote;
use App\Models\Inventario\InvProducto;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperVentaDet extends Model
{
    use HasFactory;

    protected $table = 'oper_ventas_det';

    public $timestamps = false;

    protected $fillable = [
        'venta_id',
        'producto_id',
        'lote_id',
        'cantidad',
        'precio_unitario',
        'impuesto_aplicado',
        'costo_unitario_historico',
        'subtotal',
    ];

    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'impuesto_aplicado' => 'decimal:2',
        'costo_unitario_historico' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function venta()
    {
        return $this->belongsTo(OperVenta::class, 'venta_id');
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
