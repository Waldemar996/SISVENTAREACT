<?php

namespace App\Models\Comercial;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComCliente extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'com_clientes';

    protected $fillable = [
        'razon_social',
        'nombre_comercial',
        'nit',
        'direccion',
        'telefono',
        'email',
        'limite_credito',
        'dias_credito',
        'tipo_contribuyente', // 'pequeno_contribuyente','general_iva','exento'
        'lista_precio_id',
        'vendedor_asignado_id',
    ];

    protected $casts = [
        'limite_credito' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // V9 uses timestamps for this table
    public $timestamps = true;

    // Relationships
    public function listaPrecio()
    {
        return $this->belongsTo(ComListaPrecio::class, 'lista_precio_id');
    }
}
