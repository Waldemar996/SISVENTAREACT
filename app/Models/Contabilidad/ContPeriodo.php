<?php

namespace App\Models\Contabilidad;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContPeriodo extends Model
{
    use HasFactory;

    protected $table = 'cont_periodos';
    public $timestamps = false;

    protected $fillable = [
        'anio',
        'mes',
        'estado',
        'fecha_cierre',
        'usuario_cierre_id'
    ];
}
