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
        Schema::table('oper_devoluciones', function (Blueprint $table) {
            $table->unsignedBigInteger('sesion_caja_id')->nullable()->after('usuario_id');
            $table->decimal('monto_total', 10, 2)->default(0)->after('monto_reembolsado');
            
            // Foreign key constraint
            $table->foreign('sesion_caja_id')
                  ->references('id')
                  ->on('tes_sesiones_caja')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oper_devoluciones', function (Blueprint $table) {
            $table->dropForeign(['sesion_caja_id']);
            $table->dropColumn(['sesion_caja_id', 'monto_total']);
        });
    }
};
