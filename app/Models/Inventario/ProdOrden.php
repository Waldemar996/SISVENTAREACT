<?php

namespace App\Models\Inventario;

use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProdOrden extends Model
{
    use HasFactory;

    protected $table = 'prod_ordenes';
    // Has timestamps

    protected $fillable = [
        'numero_orden',
        'producto_terminado_id',
        'cantidad_planeada',
        'cantidad_producida',
        'bodega_destino_id',
        'fecha_inicio_programada',
        'fecha_fin_real',
        'estado',
        'responsable_id',
        'observaciones',
        'costo_estimado_total',
        'costo_real_total',
    ];

    protected $casts = [
        'fecha_inicio_programada' => 'date',
        'fecha_fin_real' => 'date',
        'cantidad_planeada' => 'decimal:2',
        'cantidad_producida' => 'decimal:2',
        'costo_estimado_total' => 'decimal:2',
        'costo_real_total' => 'decimal:2',
    ];

    public function productoTerminado()
    {
        return $this->belongsTo(InvProducto::class, 'producto_terminado_id');
    }

    public function bodegaDestino()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_destino_id');
    }

    public function responsable()
    {
        return $this->belongsTo(SysUsuario::class, 'responsable_id');
    }

    public function detalles()
    {
        return $this->hasMany(ProdOrdenDet::class, 'orden_id');
    }
}
