<?php

namespace App\Models\Config;

use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SysAuditoriaLog extends Model
{
    use HasFactory;

    protected $table = 'sys_auditoria_logs';

    public $timestamps = false; // Timestamp manual en 'fecha'

    protected $fillable = [
        'usuario_id',
        'modulo',
        'accion',
        'tabla_afectada',
        'registro_id',
        'datos_anteriores',
        'datos_nuevos',
        'ip_usuario',
        'navegador_info',
        'fecha',
    ];

    protected $casts = [
        'datos_anteriores' => 'array',
        'datos_nuevos' => 'array',
        'fecha' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }
}
