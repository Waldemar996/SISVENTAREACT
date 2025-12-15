<?php

namespace App\Models\Logistica;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Inventario\InvBodegaProducto;
use App\Models\Tesoreria\TesCaja;

class LogBodega extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'log_bodegas';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'codigo_sucursal',
        'direccion',
        'telefono',
        'tipo',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(InvBodegaProducto::class, 'bodega_id');
    }

    public function cajas()
    {
        return $this->hasMany(TesCaja::class, 'bodega_id');
    }
}
