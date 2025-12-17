<?php

namespace App\Models\Logistica;

use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogRuta extends Model
{
    use HasFactory;

    protected $table = 'log_rutas';

    public $timestamps = false;

    protected $fillable = [
        'nombre_ruta',
        'zona_cobertura',
        'vendedor_id',
    ];

    public function vendedor()
    {
        return $this->belongsTo(SysUsuario::class, 'vendedor_id');
    }
}
