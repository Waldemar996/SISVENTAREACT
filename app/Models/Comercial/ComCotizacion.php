<?php

namespace App\Models\Comercial;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\RRHH\SysUsuario;

class ComCotizacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'com_cotizaciones';
    // Has timestamps

    protected $fillable = [
        'codigo_cotizacion',
        'cliente_id',
        'usuario_id',
        'fecha_emision',
        'fecha_vencimiento',
        'total',
        'notas',
        'estado',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'total' => 'decimal:2',
    ];

    public function cliente()
    {
        return $this->belongsTo(ComCliente::class, 'cliente_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }

    public function detalles()
    {
        return $this->hasMany(ComCotizacionDet::class, 'cotizacion_id');
    }
}
