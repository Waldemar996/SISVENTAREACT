<?php

namespace App\Models\RRHH;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RrhhPuesto extends Model
{
    use HasFactory;

    protected $table = 'rrhh_puestos';
    public $timestamps = false;

    protected $fillable = ['nombre_puesto', 'departamento_id', 'salario_base'];

    public function departamento()
    {
        return $this->belongsTo(RrhhDepartamento::class, 'departamento_id');
    }

    public function empleados()
    {
        return $this->hasMany(RrhhEmpleado::class, 'puesto_id');
    }
}
