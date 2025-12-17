<?php

namespace App\Models\Tesoreria;

use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TesSesionCaja extends Model
{
    use HasFactory;

    protected $table = 'tes_sesiones_caja';

    public $timestamps = false;

    protected $fillable = [
        'caja_id',
        'usuario_id',
        'fecha_apertura',
        'fecha_cierre',
        'monto_inicial',
        'monto_final_sistema',
        'monto_final_real',
        'diferencia',
        'estado',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'monto_inicial' => 'decimal:2',
        'monto_final_sistema' => 'decimal:2',
        'monto_final_real' => 'decimal:2',
        'diferencia' => 'decimal:2',
    ];

    public function caja()
    {
        return $this->belongsTo(TesCaja::class, 'caja_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }

    public function ventas()
    {
        return $this->hasMany(\App\Models\Operaciones\OperVenta::class, 'sesion_caja_id');
    }
}
