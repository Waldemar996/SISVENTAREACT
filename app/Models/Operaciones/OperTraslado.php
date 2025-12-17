<?php

namespace App\Models\Operaciones;

use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperTraslado extends Model
{
    use HasFactory;

    protected $table = 'oper_traslados';

    public $timestamps = false;

    protected $fillable = [
        'numero_traslado',
        'bodega_origen_id',
        'bodega_destino_id',
        'usuario_solicita_id',
        'usuario_autoriza_id',
        'fecha_solicitud',
        'fecha_recepcion',
        'estado',
        'observaciones',
    ];

    protected $casts = [
        'fecha_solicitud' => 'datetime',
        'fecha_recepcion' => 'datetime',
    ];

    public function bodegaOrigen()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_origen_id');
    }

    public function bodegaDestino()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_destino_id');
    }

    public function usuarioSolicita()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_solicita_id');
    }

    public function usuarioAutoriza()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_autoriza_id');
    }

    public function detalles()
    {
        return $this->hasMany(OperTrasladoDet::class, 'traslado_id');
    }
}
