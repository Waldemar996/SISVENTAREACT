<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinTipoImpuesto extends Model
{
    use HasFactory;

    protected $table = 'fin_tipos_impuestos';
    public $timestamps = false;

    protected $fillable = ['nombre', 'porcentaje', 'codigo_sat'];

    protected $casts = [
        'porcentaje' => 'decimal:2',
    ];
}
