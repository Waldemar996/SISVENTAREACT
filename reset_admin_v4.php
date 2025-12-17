<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "Starting Admin Reset V4...\n";

// 1. Ensure Department exists
$deptId = DB::table('rrhh_departamentos')->value('id');
if (!$deptId) {
    $deptId = DB::table('rrhh_departamentos')->insertGetId([
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

// 2. Ensure Puesto (Cargo) exists
$puestoId = DB::table('rrhh_puestos')->value('id');
if (!$puestoId) {
    $puestoId = DB::table('rrhh_puestos')->insertGetId([
        'nombre' => 'Gerente General',
        'departamento_id' => $deptId,
        'salario_base' => 5000.00,
        'activo' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Created Puesto ID: $puestoId\n";
} else {
    echo "Using Puesto ID: $puestoId\n";
}

// 3. Find or Create Empleado
// Note: Check column names for Empleado just in case
// Usually: codigo, nombres, apellidos, email, puesto_id (not cargo_id?), departamento_id
// I'll check schema columns for rrhh_empleados quickly via loose code, or assume standard.
// Migration said 'rrhh_puestos' so likely 'puesto_id'.
// I'll assume standard naming but if it fails I'll debugging.
// Actually, earlier diagnostic for sys_usuarios worked.
// Let's look at schema_v9.sql is blocked.
// I'll try to insert with 'puesto_id'.

$emp = DB::table('rrhh_empleados')->where('email', 'admin@admin.com')->first();
if (!$emp) {
    // Check if 'puesto_id' or 'cargo_id'
    // I'll try 'puesto_id' first since table is 'rrhh_puestos'.
    try {
        $empId = DB::table('rrhh_empleados')->insertGetId([
            'codigo' => 'ADM001',
            'nombres' => 'Administrador',
            'apellidos' => 'Sistema',
            'email' => 'admin@admin.com',
            'telefono' => '00000000',
            'fecha_contratacion' => now(),
            'puesto_id' => $puestoId, 
            'departamento_id' => $deptId,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "Created Empleado ID: $empId\n";
    } catch (\Exception $e) {
        echo "Error creating employee with puesto_id: " . $e->getMessage() . "\n";
        // Fallback to cargo_id?
         $empId = DB::table('rrhh_empleados')->insertGetId([
            'codigo' => 'ADM001',
            'nombres' => 'Administrador',
            'apellidos' => 'Sistema',
            'email' => 'admin@admin.com',
            'telefono' => '00000000',
            'fecha_contratacion' => now(),
            'cargo_id' => $puestoId, 
            'departamento_id' => $deptId,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "Created Empleado ID (fallback): $empId\n";
    }
} else {
    $empId = $emp->id;
    echo "Using Empleado ID: " . $emp->id . "\n";
}

// 4. Update or Create User
$user = User::where('username', 'admin')->first();

if ($user) {
    echo "User 'admin' found. Updating password...\n";
    $user->password_hash = Hash::make('password123');
    $user->empleado_id = $empId;
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
