<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Using raw SQL because doctrine/dbal might not be installed
        DB::statement('ALTER TABLE inv_kardex MODIFY COLUMN tipo_movimiento VARCHAR(50) NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to what it likely was (assuming 20 or ENUM, but safest is to leave widened or try to shrink to 20)
        // DB::statement("ALTER TABLE inv_kardex MODIFY COLUMN tipo_movimiento VARCHAR(20) NOT NULL");
    }
};
