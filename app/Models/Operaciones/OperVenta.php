<?php

namespace App\Models\Operaciones;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Comercial\ComCliente;
use App\Models\RRHH\SysUsuario;
use App\Models\Logistica\LogBodega;
use App\Models\Tesoreria\TesSesionCaja;

class OperVenta extends Model
{
    use HasFactory;

    protected $table = 'oper_ventas';
    public $timestamps = true;

    protected $fillable = [
        'cliente_id',
        'usuario_id',
        'bodega_id',
        'sesion_caja_id',
        'tipo_comprobante',
        'numero_comprobante',
        'fecha_emision',
        'fel_uuid',
        'fel_serie',
        'fel_numero',
        'subtotal',
        'total_impuestos',
        'descuento',
        'total_venta',
        'total_venta',
        'estado',
        'forma_pago',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'subtotal' => 'decimal:2',
        'total_impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total_venta' => 'decimal:2',
    ];

    public function cliente()
    {
        return $this->belongsTo(ComCliente::class, 'cliente_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }

    public function bodega()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_id');
    }

    public function sesionCaja()
    {
        return $this->belongsTo(TesSesionCaja::class, 'sesion_caja_id');
    }

    public function detalles()
    {
        return $this->hasMany(OperVentaDet::class, 'venta_id');
    }

    public function devoluciones()
    {
        return $this->hasMany(OperDevolucion::class, 'venta_origen_id');
    }
}
