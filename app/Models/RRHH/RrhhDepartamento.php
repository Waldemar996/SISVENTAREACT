<?php

namespace App\Models\RRHH;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RrhhDepartamento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rrhh_departamentos';

    public $timestamps = false; // V9 table has no timestamps

    protected $fillable = ['nombre', 'descripcion'];

    public function puestos()
    {
        return $this->hasMany(RrhhPuesto::class, 'departamento_id');
    }
}
