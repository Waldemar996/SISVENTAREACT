<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Inventario\InvCategoria;
use App\Models\User;
use Illuminate\Support\Str;

echo "--- Functional Verification: CRUD & Audit ---\n";

// 1. CREATE Verification
$catName = "Test Category " . Str::random(5);
echo "1. Creating Category '$catName' ... ";
$cat = InvCategoria::create(['nombre' => $catName]);

if ($cat && $cat->exists) {
    echo "OK (ID: {$cat->id})\n";
} else {
    echo "FAILED\n";
    exit(1);
}

// 2. READ Verification
echo "2. Reading Category ... ";
$readCat = InvCategoria::find($cat->id);
if ($readCat && $readCat->nombre === $catName) {
    echo "OK\n";
} else {
    echo "FAILED\n";
}

// 3. EDIT Verification
$newName = $catName . " (Updated)";
echo "3. Updating Category to '$newName' ... ";
$cat->update(['nombre' => $newName]);
$cat->refresh();

if ($cat->nombre === $newName) {
    echo "OK\n";
} else {
    echo "FAILED\n";
}

// 4. SOFT DELETE Verification
echo "4. Soft Deleting Category ... ";
$cat->delete();

// Check if it's logically deleted
$deletedCat = InvCategoria::withTrashed()->find($cat->id);
$isDeleted = $deletedCat->trashed();
$existsInNormalQuery = InvCategoria::find($cat->id);

if ($isDeleted && !$existsInNormalQuery && $deletedCat->deleted_at !== null) {
    echo "OK (Logically Deleted at {$deletedCat->deleted_at})\n";
} else {
    echo "FAILED (Physical delete or trait missing)\n";
    echo " - Is Trashed: " . ($isDeleted ? 'Yes' : 'No') . "\n";
    echo " - Exists in Normal Query: " . ($existsInNormalQuery ? 'Yes' : 'No') . "\n";
}

// 5. User Soft Delete Verification
echo "5. Verifying User SoftDeletes ... ";
// Create dummy user
try {
    $user = User::create([
        'username' => 'testuser_'.Str::random(4),
        'email' => 'test_'.Str::random(5).'@example.com',
        'password_hash' => 'hash',
        'activo' => true
    ]);
    $user->delete();
    
    $deletedUser = User::withTrashed()->find($user->id);
    if ($deletedUser && $deletedUser->trashed()) {
        echo "OK (User Logically Deleted)\n";
    } else {
        echo "FAILED (User Physical Delete?)\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "--- Verification Complete ---\n";
