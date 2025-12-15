<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Operaciones\OperCompra;
use App\Models\RRHH\SysUsuario;

class FinPagoProveedor extends Model
{
    use HasFactory;

    protected $table = 'fin_pagos_proveedores';
    public $timestamps = false;

    protected $fillable = [
        'compra_id',
        'fecha_pago',
        'monto_abonado',
        'metodo_pago',
        'referencia',
        'banco_cuenta_id',
        'usuario_pagador_id',
    ];

    protected $casts = [
        'fecha_pago' => 'datetime',
        'monto_abonado' => 'decimal:2',
    ];

    public function compra()
    {
        return $this->belongsTo(OperCompra::class, 'compra_id');
    }

    public function bancoCuenta()
    {
        return $this->belongsTo(TesBancosCuenta::class, 'banco_cuenta_id');
    }

    public function usuarioPagador()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_pagador_id');
    }
}
