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
        // SQL executed manually via MySQL CLI for stability
        // $sql = file_get_contents(database_path('schema_v9.sql'));
        // DB::unprepared($sql);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order of dependency
        $tables = [
            'prod_ordenes_det',
            'prod_ordenes',
            'prod_formulas',
            'rrhh_empleados',
            'rrhh_puestos',
            'rrhh_departamentos',
            'fin_pagos_proveedores',
            'fin_pagos_clientes',
            'oper_traslados_det',
            'oper_traslados',
            'oper_devoluciones_det',
            'oper_devoluciones',
            'oper_ventas_det',
            'oper_ventas',
            'oper_compras_det',
            'oper_compras',
            'com_cotizaciones_det',
            'com_cotizaciones',
            'inv_kardex',
            'inv_series',
            'inv_lotes',
            'inv_bodega_producto',
            'inv_precios_producto',
            'inv_galeria_productos',
            'inv_productos',
            'inv_unidades',
            'inv_marcas',
            'inv_categorias',
            'log_rutas',
            'fin_gastos',
            'fin_categorias_gastos',
            'tes_sesiones_caja',
            'tes_cajas',
            'log_bodegas',
            'tes_bancos_cuentas',
            'fin_tipos_impuestos',
            'com_proveedores',
            'com_clientes',
            'com_listas_precios',
            'cont_partidas_det',
            'cont_partidas',
            'cont_periodos',
            'cont_cuentas',
            'password_resets',
            'personal_access_tokens',
            'failed_jobs',
            'cache_locks',
            'cache',
            'sessions',
            'sys_auditoria_logs',
            'sys_usuarios',
            'sys_configuracion',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        foreach ($tables as $table) {
            DB::statement("DROP TABLE IF EXISTS `{$table}`");
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};
