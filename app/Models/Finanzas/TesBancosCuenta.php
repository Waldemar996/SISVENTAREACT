<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TesBancosCuenta extends Model
{
    use HasFactory;

    protected $table = 'tes_bancos_cuentas';
    public $timestamps = false;

    protected $fillable = [
        'banco_nombre',
        'numero_cuenta',
        'tipo_cuenta',
        'moneda',
        'saldo_actual',
        'cuenta_contable_id',
    ];

    protected $casts = [
        'saldo_actual' => 'decimal:2',
    ];

    public function cuentaContable()
    {
        return $this->belongsTo(ContCuenta::class, 'cuenta_contable_id');
    }
}
