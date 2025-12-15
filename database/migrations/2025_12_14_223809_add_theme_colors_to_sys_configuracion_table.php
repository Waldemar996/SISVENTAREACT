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
        Schema::table('sys_configuracion', function (Blueprint $table) {
            $table->string('color_primary', 7)->default('#4F46E5')->after('email_contacto'); // Indigo-600
            $table->string('color_secondary', 7)->default('#1F2937')->after('color_primary'); // Gray-800
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sys_configuracion', function (Blueprint $table) {
            $table->dropColumn(['color_primary', 'color_secondary']);
        });
    }
};
