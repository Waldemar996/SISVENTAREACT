<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContabilidadSeeder extends Seeder
{
    public function run()
    {
        // 1. Activos
        $this->createCuenta(null, '1', 'ACTIVO', 'activo', 1, false);
        $this->createCuenta(1, '1.1', 'ACTIVO CORRIENTE', 'activo', 2, false);
        $this->createCuenta(2, '1.1.01', 'CAJA Y BANCOS', 'activo', 3, false);
        $this->createCuenta(3, '1.1.01.01', 'Caja General', 'activo', 4, true);
        $this->createCuenta(3, '1.1.01.02', 'Caja Chica', 'activo', 4, true);
        $this->createCuenta(3, '1.1.01.03', 'Bancos Moneda Nacional', 'activo', 4, true);

        $this->createCuenta(2, '1.1.02', 'CUENTAS POR COBRAR', 'activo', 3, false);
        $this->createCuenta(7, '1.1.02.01', 'Clientes Locales', 'activo', 4, true);
        $this->createCuenta(7, '1.1.02.02', 'Deudores Varios', 'activo', 4, true);

        $this->createCuenta(2, '1.1.03', 'INVENTARIOS', 'activo', 3, false);
        $this->createCuenta(10, '1.1.03.01', 'Mercaderías', 'activo', 4, true);

        $this->createCuenta(1, '1.2', 'ACTIVO NO CORRIENTE', 'activo', 2, false);
        $this->createCuenta(12, '1.2.01', 'PROPIEDAD PLANTA Y EQUIPO', 'activo', 3, false);
        $this->createCuenta(13, '1.2.01.01', 'Mobiliario y Equipo', 'activo', 4, true);
        $this->createCuenta(13, '1.2.01.02', 'Equipo de Cómputo', 'activo', 4, true);
        $this->createCuenta(13, '1.2.01.03', 'Vehículos', 'activo', 4, true);

        // 2. Pasivos
        $this->createCuenta(null, '2', 'PASIVO', 'pasivo', 1, false);
        $this->createCuenta(17, '2.1', 'PASIVO CORRIENTE', 'pasivo', 2, false);
        $this->createCuenta(18, '2.1.01', 'CUENTAS POR PAGAR', 'pasivo', 3, false);
        $this->createCuenta(19, '2.1.01.01', 'Proveedores Locales', 'pasivo', 4, true);
        $this->createCuenta(19, '2.1.01.02', 'Acreedores Varios', 'pasivo', 4, true);
        $this->createCuenta(19, '2.1.01.03', 'Impuestos por Pagar (IVA)', 'pasivo', 4, true);

        // 3. Patrimonio
        $this->createCuenta(null, '3', 'PATRIMONIO', 'patrimonio', 1, false);
        $this->createCuenta(23, '3.1', 'CAPITAL CONTABLE', 'patrimonio', 2, false);
        $this->createCuenta(24, '3.1.01', 'Capital Social', 'patrimonio', 3, true);
        $this->createCuenta(24, '3.1.02', 'Resultados Acumulados', 'patrimonio', 3, true);
        $this->createCuenta(24, '3.1.03', 'Resultado del Ejercicio', 'patrimonio', 3, true);

        // 4. Ingresos
        $this->createCuenta(null, '4', 'INGRESOS', 'ingreso', 1, false);
        $this->createCuenta(28, '4.1', 'INGRESOS DE OPERACIÓN', 'ingreso', 2, false);
        $this->createCuenta(29, '4.1.01', 'Ventas de Mercaderías', 'ingreso', 3, true);
        $this->createCuenta(29, '4.1.02', 'Servicios Prestados', 'ingreso', 3, true);

        // 5. Gastos
        $this->createCuenta(null, '5', 'GASTOS', 'gasto', 1, false);
        $this->createCuenta(32, '5.1', 'COSTOS DE VENTAS', 'gasto', 2, false);
        $this->createCuenta(33, '5.1.01', 'Costo de Ventas', 'gasto', 3, true);
        
        $this->createCuenta(32, '5.2', 'GASTOS DE OPERACIÓN', 'gasto', 2, false);
        $this->createCuenta(35, '5.2.01', 'Sueldos y Salarios', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.02', 'Alquileres', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.03', 'Servicios Públicos', 'gasto', 3, true);
        $this->createCuenta(35, '5.2.04', 'Papelería y Útiles', 'gasto', 3, true);
    }

    private function createCuenta($padreId, $codigo, $nombre, $tipo, $nivel, $aceptaMovimiento)
    {
        if (DB::table('cont_cuentas')->where('codigo_cuenta', $codigo)->exists()) {
            return;
        }
        
        $realPadreId = null;
        if ($padreId !== null) {
            // Inferir padre por código
            $lastDot = strrpos($codigo, '.');
             if ($lastDot !== false) {
                 $codigoPadre = substr($codigo, 0, $lastDot);
                 $padre = DB::table('cont_cuentas')->where('codigo_cuenta', $codigoPadre)->first();
                 if ($padre) {
                     $realPadreId = $padre->id;
                 }
             }
        }

        DB::table('cont_cuentas')->insert([
            'codigo_cuenta' => $codigo,
            'nombre_cuenta' => $nombre,
            'tipo' => $tipo,
            'nivel' => $nivel,
            'cuenta_padre_id' => $realPadreId,
            'es_cuenta_movimiento' => $aceptaMovimiento,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}
