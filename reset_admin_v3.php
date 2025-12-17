<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\RRHH\Empleado;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "Starting Admin Reset...\n";

// 1. Ensure Department exists (needed for Empleado)
$deptId = DB::table('rh_departamentos')->value('id');
if (!$deptId) {
    $deptId = DB::table('rh_departamentos')->insertGetId([
        'nombre' => 'Gerencia General',
        'descripcion' => 'Departamento Administrativo',
        'activo' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created Department ID: $deptId\n";
} else {
    echo "Using Department ID: $deptId\n";
}

// 2. Ensure Cargo exists (needed for Empleado)
$cargoId = DB::table('rh_cargos')->value('id');
if (!$cargoId) {
    $cargoId = DB::table('rh_cargos')->insertGetId([
        'nombre' => 'Gerente General',
        'departamento_id' => $deptId,
        'salario_base' => 5000.00,
        'activo' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created Cargo ID: $cargoId\n";
} else {
    echo "Using Cargo ID: $cargoId\n";
}

// 3. Find or Create Empleado
$emp = Empleado::where('email', 'admin@admin.com')->first();
if (!$emp) {
    $empId = DB::table('rh_empleados')->insertGetId([
        'codigo' => 'ADM001',
        'nombres' => 'Administrador',
        'apellidos' => 'Sistema',
        'email' => 'admin@admin.com',
        'telefono' => '00000000',
        'fecha_contratacion' => now(),
        'cargo_id' => $cargoId,
        'departamento_id' => $deptId,
        'estado' => 'activo',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created Empleado ID: $empId\n";
} else {
    $empId = $emp->id;
    echo "Using Empleado ID: " . $emp->id . "\n";
}

// 4. Update or Create User
$user = User::where('username', 'admin')->first();

if ($user) {
    echo "User 'admin' found. Updating password...\n";
    $user->password_hash = Hash::make('password123'); // Use correct column
    $user->empleado_id = $empId; // Ensure link
    $user->save();
    echo "User 'admin' updated successfully.\n";
} else {
    echo "Creating new 'admin' user...\n";
    User::create([
        'username' => 'admin',
        'email' => 'admin@admin.com',
        'password_hash' => Hash::make('password123'),
        'rol' => 'superadmin',
        'activo' => true,
        'empleado_id' => $empId,
        'ultimo_acceso' => now(),
    ]);
    echo "User 'admin' created successfully.\n";
}
