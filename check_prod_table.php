<?php
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$table = 'prod_formulas';
$columns = Schema::getColumnListing($table);

echo "Columns in '$table':\n";
print_r($columns);

echo "\nChecking for deleted_at...\n";
if (in_array('deleted_at', $columns)) {
    echo "EXISTS\n";
} else {
    echo "MISSING\n";
}

echo "\nChecking for created_at...\n";
if (in_array('created_at', $columns)) {
    echo "EXISTS\n";
} else {
    echo "MISSING\n";
}

echo "\nChecking for updated_at...\n";
if (in_array('updated_at', $columns)) {
    echo "EXISTS\n";
} else {
    echo "MISSING\n";
}
