<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\RRHH\SysUsuario;
use App\Models\Tesoreria\TesSesionCaja;

class FinGasto extends Model
{
    use HasFactory;

    protected $table = 'fin_gastos';
    public $timestamps = false;

    protected $fillable = [
        'descripcion',
        'categoria_id',
        'monto',
        'fecha_gasto',
        'banco_cuenta_id',
        'sesion_caja_id',
        'usuario_id',
    ];

    protected $casts = [
        'fecha_gasto' => 'datetime',
        'monto' => 'decimal:2',
    ];

    public function categoria()
    {
        return $this->belongsTo(FinCategoriaGasto::class, 'categoria_id');
    }

    public function bancoCuenta()
    {
        return $this->belongsTo(TesBancosCuenta::class, 'banco_cuenta_id');
    }

    public function sesionCaja()
    {
        return $this->belongsTo(TesSesionCaja::class, 'sesion_caja_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }
}
