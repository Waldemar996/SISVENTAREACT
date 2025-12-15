<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Operaciones\OperVenta;
use App\Models\Tesoreria\TesSesionCaja;
use App\Models\RRHH\SysUsuario;

class FinPagoCliente extends Model
{
    use HasFactory;

    protected $table = 'fin_pagos_clientes';
    public $timestamps = false;

    protected $fillable = [
        'venta_id',
        'fecha_pago',
        'monto_abonado',
        'metodo_pago',
        'referencia',
        'sesion_caja_id',
        'banco_cuenta_id',
        'usuario_cobrador_id',
    ];

    protected $casts = [
        'fecha_pago' => 'datetime',
        'monto_abonado' => 'decimal:2',
    ];

    public function venta()
    {
        return $this->belongsTo(OperVenta::class, 'venta_id');
    }

    public function sesionCaja()
    {
        return $this->belongsTo(TesSesionCaja::class, 'sesion_caja_id');
    }

    public function bancoCuenta()
    {
        return $this->belongsTo(TesBancosCuenta::class, 'banco_cuenta_id');
    }

    public function usuarioCobrador()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_cobrador_id');
    }
}
