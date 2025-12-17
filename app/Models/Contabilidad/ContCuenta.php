<?php

namespace App\Models\Contabilidad;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContCuenta extends Model
{
    use HasFactory;

    protected $table = 'cont_cuentas';
    // Table created_at/updated_at exist in schema for this table (Line 144)
    // No, wait. Let me check schema for cont_cuentas.
    // Line 144: created_at timestamp NULL

    protected $fillable = [
        'codigo_cuenta',
        'nombre_cuenta',
        'tipo',
        'nivel',
        'es_cuenta_movimiento',
        'cuenta_padre_id',
    ];

    public function padre()
    {
        return $this->belongsTo(ContCuenta::class, 'cuenta_padre_id');
    }

    public function hijos()
    {
        return $this->hasMany(ContCuenta::class, 'cuenta_padre_id');
    }
}
