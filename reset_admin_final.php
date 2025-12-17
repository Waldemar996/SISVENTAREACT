<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "Starting Admin Reset Final...\n";

// 1. Department
$deptId = DB::table('rrhh_departamentos')->value('id');
if (!$deptId) {
    $deptId = DB::table('rrhh_departamentos')->insertGetId([
        'nombre' => 'Gerencia General',
        'descripcion' => 'Departamento Administrativo'
    ]);
    echo "Created Dept: $deptId\n";
} else { echo "Dept exists: $deptId\n"; }

// 2. Puesto
$puestoId = DB::table('rrhh_puestos')->value('id');
if (!$puestoId) {
    $puestoId = DB::table('rrhh_puestos')->insertGetId([
        'nombre_puesto' => 'Gerente General',
        'departamento_id' => $deptId,
        'salario_base' => 5000.00
    ]);
    echo "Created Puesto: $puestoId\n";
} else { echo "Puesto exists: $puestoId\n"; }

// 3. Empleado
// Columns: id, codigo_empleado, nombres, apellidos, dpi_identificacion, telefono, email_personal, direccion_residencia, puesto_id, fecha_contratacion, estado, foto_perfil_url
$emp = DB::table('rrhh_empleados')->where('email_personal', 'admin@admin.com')->first();

if (!$emp) {
    $empId = DB::table('rrhh_empleados')->insertGetId([
        'codigo_empleado' => 'ADM001',
        'nombres' => 'Administrador',
        'apellidos' => 'Sistema',
        'dpi_identificacion' => '1234567890101', // Dummy DPI
        'telefono' => '55555555',
        'email_personal' => 'admin@admin.com',
        'direccion_residencia' => 'Ciudad',
        'puesto_id' => $puestoId,
        'fecha_contratacion' => '2025-01-01',
        'estado' => 'activo'
    ]);
    echo "Created Empleado: $empId\n";
} else {
    $empId = $emp->id;
    echo "Empleado exists: $empId\n";
}

// 4. User
$user = User::where('username', 'admin')->first();
if ($user) {
    $user->password_hash = Hash::make('password123');
    $user->empleado_id = $empId;
    $user->save();
    echo "User 'admin' password updated.\n";
} else {
    User::create([
        'username' => 'admin',
        'email' => 'admin@admin.com',
        'password_hash' => Hash::make('password123'),
        'rol' => 'superadmin',
        'activo' => true,
        'empleado_id' => $empId,
        'ultimo_acceso' => now()
    ]);
    echo "User 'admin' created.\n";
}
