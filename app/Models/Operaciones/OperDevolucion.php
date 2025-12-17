<?php

namespace App\Models\Operaciones;

use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperDevolucion extends Model
{
    use HasFactory;

    protected $table = 'oper_devoluciones';

    public $timestamps = false;

    protected $fillable = [
        'venta_origen_id',
        'fecha_devolucion',
        'motivo',
        'monto_reembolsado',
        'monto_total',
        'sesion_caja_id',
        'es_cambio_producto',
        'estado',
        'usuario_id',
    ];

    protected $casts = [
        'fecha_devolucion' => 'datetime',
        'monto_reembolsado' => 'decimal:2',
        'es_cambio_producto' => 'boolean',
    ];

    public function venta()
    {
        return $this->belongsTo(OperVenta::class, 'venta_origen_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }

    public function detalles()
    {
        return $this->hasMany(OperDevolucionDet::class, 'devolucion_id');
    }
}
