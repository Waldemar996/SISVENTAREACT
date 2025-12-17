<?php

namespace App\Models\Config;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SysConfiguracion extends Model
{
    use HasFactory;

    protected $table = 'sys_configuracion';

    protected $fillable = [
        'nombre_empresa',
        'nit_empresa',
        'direccion_fiscal',
        'moneda_simbolo',
        'impuesto_general_iva',
        'ruta_logo',
        'website',
        'email_contacto',
        'color_primary',
        'color_secondary',
    ];

    public $timestamps = false; // Solo tiene actualizado_en via DB trigger/default definition o manual

    protected $casts = [
        'actualizado_en' => 'datetime',
        'impuesto_general_iva' => 'decimal:2',
    ];
}
