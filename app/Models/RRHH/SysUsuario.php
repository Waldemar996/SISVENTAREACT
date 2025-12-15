<?php

namespace App\Models\RRHH;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class SysUsuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'sys_usuarios';

    public $timestamps = false;

    protected $fillable = [
        'empleado_id',
        'username',
        'email',
        'password_hash',
        'rol',
        'activo',
        'ultimo_acceso',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'ultimo_acceso' => 'datetime',
    ];

    // Laravel Auth override
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function empleado()
    {
        return $this->belongsTo(RrhhEmpleado::class, 'empleado_id');
    }
}
