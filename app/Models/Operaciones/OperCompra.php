<?php

namespace App\Models\Operaciones;

use App\Models\Comercial\ComProveedor;
use App\Models\Logistica\LogBodega;
use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperCompra extends Model
{
    use HasFactory;

    protected $table = 'oper_compras';

    public $timestamps = false; // Only a fecha column is defined in SQL, or similar

    protected $fillable = [
        'proveedor_id',
        'bodega_id',
        'usuario_id',
        'tipo_comprobante',
        'numero_comprobante',
        'numero_factura', // Added field
        'fecha_emision',
        'subtotal',
        'total_impuestos',
        'total_compra',
        'estado',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'subtotal' => 'decimal:2',
        'total_impuestos' => 'decimal:2',
        'total_compra' => 'decimal:2',
    ];

    public function proveedor()
    {
        return $this->belongsTo(ComProveedor::class, 'proveedor_id');
    }

    public function bodega()
    {
        return $this->belongsTo(LogBodega::class, 'bodega_id');
    }

    public function usuario()
    {
        return $this->belongsTo(SysUsuario::class, 'usuario_id');
    }

    public function detalles()
    {
        return $this->hasMany(OperCompraDet::class, 'compra_id');
    }
}
