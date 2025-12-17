<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tables = DB::select('SHOW TABLES');
$dbName = env('DB_DATABASE', 'SistemaERP_DB');
$key = 'Tables_in_'.$dbName;

$empty = [];
$populated = [];

foreach ($tables as $table) {
    $tableName = array_values((array) $table)[0];
    if ($tableName === 'migrations') {
        continue;
    }

    $count = DB::table($tableName)->count();
    if ($count === 0) {
        $empty[] = $tableName;
    } else {
        $populated[$tableName] = $count;
    }
}

echo "\n=== TABLAS VACÍAS (".count($empty).") ===\n";
foreach ($empty as $t) {
    echo "- $t\n";
}

echo "\n=== TABLAS POBLADAS (".count($populated).") ===\n";
foreach ($populated as $t => $c) {
    echo str_pad($t, 35).": $c\n";
}
