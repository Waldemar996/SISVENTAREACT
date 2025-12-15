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
        Schema::table('oper_devoluciones_det', function (Blueprint $table) {
            $table->decimal('precio_unitario', 10, 2)->default(0)->after('cantidad');
            $table->decimal('subtotal', 10, 2)->default(0)->after('precio_unitario');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oper_devoluciones_det', function (Blueprint $table) {
            $table->dropColumn(['precio_unitario', 'subtotal']);
        });
    }
};
