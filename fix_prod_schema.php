<?php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Adding deleted_at to prod_formulas...\n";

Schema::table('prod_formulas', function (Blueprint $table) {
    if (!Schema::hasColumn('prod_formulas', 'deleted_at')) {
        $table->softDeletes();
        echo "Column 'deleted_at' added.\n";
    } else {
        echo "Column 'deleted_at' already exists.\n";
    }
});

echo "Done.\n";
