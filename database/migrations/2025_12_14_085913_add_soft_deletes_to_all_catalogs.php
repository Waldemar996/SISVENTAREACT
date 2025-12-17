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
        $tables = [
            'inv_categorias',
            'inv_marcas',
            'inv_unidades',
            'log_bodegas',
            'rrhh_empleados',
            'rrhh_departamentos',
            'tes_cajas',
            'sys_usuarios',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                if (! Schema::hasColumn($table->getTable(), 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'inv_categorias',
            'inv_marcas',
            'inv_unidades',
            'log_bodegas',
            'rrhh_empleados',
            'rrhh_departamentos',
            'tes_cajas',
            'sys_usuarios',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                // $table->dropSoftDeletes(); // Optional: keeps data safely even on rollback usually
                if (Schema::hasColumn($table->getTable(), 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
