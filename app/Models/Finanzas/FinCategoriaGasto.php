<?php

namespace App\Models\Finanzas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinCategoriaGasto extends Model
{
    use HasFactory;

    protected $table = 'fin_categorias_gastos';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'es_deducible',
    ];

    protected $casts = [
        'es_deducible' => 'boolean',
    ];
}
