<?php

namespace App\Models\Comercial;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComProveedor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'com_proveedores';

    public $timestamps = true; // V9 has timestamps

    protected $fillable = [
        'razon_social',
        'nombre_comercial',
        'nit',
        'nombre_contacto',
        'telefono',
        'email',
        'regimen_fiscal', // 'pequeno_contribuyente','general','agente_retenedor'
        'dias_credito',
    ];

    protected $casts = [
        'dias_credito' => 'integer',
    ];
}
