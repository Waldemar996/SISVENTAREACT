<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Restoring Schema from schema_v9.sql...\n";

$path = database_path('schema_v9.sql');

if (!file_exists($path)) {
    die("Error: schema_v9.sql not found at $path\n");
}

$sql = file_get_contents($path);

// Disable foreign key checks to avoid errors during drop/create
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

try {
    DB::unprepared($sql);
    echo "Schema restored successfully.\n";
} catch (\Exception $e) {
    echo "Error executing SQL: " . $e->getMessage() . "\n";
} finally {
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
}
