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
        Schema::table('oper_compras', function (Blueprint $table) {
            $table->string('numero_factura', 50)->nullable()->after('numero_comprobante');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oper_compras', function (Blueprint $table) {
            $table->dropColumn('numero_factura');
        });
    }
};
