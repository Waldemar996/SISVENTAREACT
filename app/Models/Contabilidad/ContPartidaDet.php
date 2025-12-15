<?php

namespace App\Models\Contabilidad;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContPartidaDet extends Model
{
    use HasFactory;

    protected $table = 'cont_partidas_det';
    public $timestamps = false; // Detalle usually no timestamps in this schema

    protected $fillable = [
        'partida_id',
        'cuenta_contable_id',
        'concepto_linea',
        'debe',
        'haber',
        'referencia_adicional'
    ];

    public function partida()
    {
        return $this->belongsTo(ContPartida::class, 'partida_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(ContCuenta::class, 'cuenta_contable_id');
    }
}
