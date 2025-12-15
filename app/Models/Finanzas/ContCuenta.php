<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContCuenta extends Model
{
    use HasFactory;

    protected $table = 'cont_cuentas';
    public $timestamps = false;

    protected $fillable = [
        'codigo_cuenta',
        'nombre_cuenta',
        'tipo',
        'cuenta_padre_id',
    ];

    public function cuentaPadre()
    {
        return $this->belongsTo(ContCuenta::class, 'cuenta_padre_id');
    }

    public function subcuentas()
    {
        return $this->hasMany(ContCuenta::class, 'cuenta_padre_id');
    }
}
