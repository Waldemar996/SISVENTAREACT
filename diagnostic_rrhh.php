<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function desc($t) {
    try {
        echo "Table: $t\n";
        $cols = DB::select("DESCRIBE $t");
        foreach ($cols as $c) echo " - " . $c->Field . "\n";
    } catch(\Exception $e) { echo "$t error: " . $e->getMessage() . "\n"; }
}

desc('rrhh_departamentos');
desc('rrhh_puestos');
desc('rrhh_empleados');
