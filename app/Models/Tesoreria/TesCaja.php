<?php

namespace App\Models\Tesoreria;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;

class TesCaja extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tes_cajas';
    public $timestamps = false;

    protected $fillable = [
        'nombre_caja',
        'bodega_id',
        'usuario_asignado_id',
        'estado',
    ];

    public function bodega()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_id');
    }

    public function usuarioAsignado()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_asignado_id');
    }
}
