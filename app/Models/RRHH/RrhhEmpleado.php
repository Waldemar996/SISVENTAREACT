<?php

namespace App\Models\RRHH;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RrhhEmpleado extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rrhh_empleados';
    public $timestamps = false;

    protected $fillable = [
        'codigo_empleado',
        'nombres',
        'apellidos',
        'dpi_identificacion',
        'telefono',
        'email_personal',
        'direccion_residencia',
        'puesto_id',
        'fecha_contratacion',
        'estado',
        'foto_perfil_url'
    ];

    protected $casts = [
        'fecha_contratacion' => 'date',
    ];

    public function puesto()
    {
        return $this->belongsTo(RrhhPuesto::class, 'puesto_id');
    }

    public function usuario()
    {
        return $this->hasOne(\App\Models\User::class, 'empleado_id');
    }
}
