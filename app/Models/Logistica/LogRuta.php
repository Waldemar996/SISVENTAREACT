<?php

namespace App\Models\Logistica;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\RRHH\SysUsuario;

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
