<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function describe($table) {
    try {
        echo "\nTable: $table\n";
        $cols = DB::select("DESCRIBE $table");
        foreach ($cols as $col) {
            echo " - " . $col->Field . " (" . $col->Type . ")\n";
        }
    } catch (\Exception $e) {
        echo " - Table not found or error: " . $e->getMessage() . "\n";
    }
}

describe('sys_usuarios');
describe('users');

echo "\nChecking User Model Table:\n";
echo "Model Table: " . (new \App\Models\User())->getTable() . "\n";
