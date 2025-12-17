<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE inv_kardex MODIFY COLUMN tipo_movimiento ENUM('compra','venta','ajuste','traslado_salida','traslado_entrada','devolucion','produccion','consumo_produccion','devolucion_compra') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original list (WARNING: data loss if new types were used)
        DB::statement("ALTER TABLE inv_kardex MODIFY COLUMN tipo_movimiento ENUM('compra','venta','ajuste','traslado_salida','traslado_entrada','devolucion','produccion') NOT NULL");
    }
};
