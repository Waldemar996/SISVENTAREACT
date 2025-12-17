<?php

namespace Database\Factories;

use App\Models\RRHH\SysUsuario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RRHH\SysUsuario>
 */
class SysUsuarioFactory extends Factory
{
    protected $model = SysUsuario::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username' => $this->faker->unique()->userName(),
            'email' => $this->faker->unique()->safeEmail(),
            'password_hash' => Hash::make('password'), // Use generic password
            'rol' => 'cajero',
            'activo' => true,
            'ultimo_acceso' => now(),
        ];
    }
}
