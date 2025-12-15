<?php

namespace App\Models\Contabilidad;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContPartida extends Model
{
    use HasFactory;

    protected $table = 'cont_partidas';
    // Has created_at/updated_at (Line 176)

    protected $fillable = [
        'numero_partida',
        'periodo_id',
        'fecha_contable',
        'concepto',
        'origen_modulo',
        'origen_id',
        'tipo_partida',
        'estado',
        'usuario_creador_id'
    ];

    protected $casts = [
        'fecha_contable' => 'date',
    ];

    public function detalles()
    {
        return $this->hasMany(ContPartidaDet::class, 'partida_id');
    }

    public function periodo()
    {
        return $this->belongsTo(ContPeriodo::class, 'periodo_id');
    }
}
