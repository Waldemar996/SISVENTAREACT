<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// User verification logic
$user = \App\Models\User::where('username', 'admin')->first();

if ($user) {
    echo "User 'admin' found.\n";
    if (!\Illuminate\Support\Facades\Hash::check('password123', $user->password)) {
        echo "Password mismatch. Resetting...\n";
        $user->password = \Illuminate\Support\Facades\Hash::make('password123');
        $user->save();
        echo "Password reset to 'password123'.\n";
    } else {
        echo "Password checks out OK.\n";
    }
} else {
    echo "User 'admin' not found. Creating...\n";
    // We need an employee first if required by FK, assuming nullable for fallback or create dummy
    // Based on CoreDataSeeder, it requires employee_id but let's see model
    try {
        $u = new \App\Models\User();
        $u->username = 'admin';
        $u->email = 'admin@admin.com';
        $u->password = \Illuminate\Support\Facades\Hash::make('password123');
        $u->rol = 'superadmin';
        $u->activo = true;
        // check if employee_id is required
        // $u->empleado_id = ...; 
        $u->save();
        echo "User created successfully.\n";
    } catch (\Exception $e) {
        echo "Error creating user: " . $e->getMessage() . "\n";
    }
}
