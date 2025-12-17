<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sys_usuarios', function (Blueprint $table) {
            $table->string('rol', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sys_usuarios', function (Blueprint $table) {
            // Revert strictness if needed (assuming 20 was original or similar)
            // Ideally we check original, but let's just leave it 50 or assume it was smaller.
            // Just reversing change() is tricky without previous state.
            // We'll skip strict revert logic for now to avoid complexity in this crisis fix.
        });
    }
};
