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
        Schema::table('oper_ventas', function (Blueprint $table) {
            $table->enum('forma_pago', ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'OTRO'])
                  ->default('EFECTIVO')
                  ->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oper_ventas', function (Blueprint $table) {
            $table->dropColumn('forma_pago');
        });
    }
};
