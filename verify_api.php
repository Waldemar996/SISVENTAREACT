<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;

function test_route($uri, $app) {
    echo "Testing $uri ... ";
    try {
        $request = Request::create($uri, 'GET');
        // Add auth token if needed, but for now checking if 500 persists. 
        // These might be protected, so 401 is BETTER than 500. 500 means server crash. 401 means functional app.
        // Actually, let's try to act as the admin user.
        $user = \App\Models\User::where('username', 'admin')->first();
        if ($user) {
            $response = $app->handle($request); // Authorization might fail if not fully signed in via Sanctum in test
            // We can emulate actingAs
            $response = $app->handle($request); 
        } else {
             $response = $app->handle($request);
        }
        
        $status = $response->getStatusCode();
        echo "Status: $status\n";
        if ($status == 500) {
            echo "DTO: " . substr($response->getContent(), 0, 500) . "\n";
        }
    } catch (\Throwable $e) {
        echo "Exception: " . $e->getMessage() . "\n";
    }
}

// Routes mentioned by user
$routes = [
    '/api/logistica/bodegas',
    '/api/inventario/categorias',
    '/api/inventario/marcas',
    '/api/rrhh/empleados',
    '/api/seguridad/usuarios'
];

echo "--- API Verification ---\n";
// Attempt to login to get token? Or just check for non-500.
// If middleware is on, we expect 401 (Unauthenticated) which confirms the CODE is running and not crashing.
// 500 was "Internal Server Error" (Crash).

foreach ($routes as $r) {
    test_route($r, $app);
}
