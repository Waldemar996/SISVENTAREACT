<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('cont_cuentas')) {
            Schema::create('cont_cuentas', function (Blueprint $table) {
                $table->id();
                $table->string('codigo', 20)->unique();
                $table->string('nombre', 200);
                $table->enum('tipo', ['activo', 'pasivo', 'capital', 'ingreso', 'gasto', 'costos']);
                $table->integer('nivel');
                $table->foreignId('cuenta_padre_id')->nullable()->constrained('cont_cuentas')->onDelete('restrict');
                $table->boolean('acepta_movimiento')->default(true);
                $table->boolean('activa')->default(true);
                $table->string('descripcion', 500)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cont_partidas')) {
            Schema::create('cont_partidas', function (Blueprint $table) {
                $table->id();
                $table->string('numero_partida', 50)->unique();
                $table->date('fecha');
                $table->string('concepto', 500);
                $table->decimal('total_debe', 15, 2);
                $table->decimal('total_haber', 15, 2);
                $table->enum('estado', ['activa', 'anulada'])->default('activa');
                $table->foreignId('usuario_id')->constrained('sys_usuarios')->onDelete('restrict');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cont_partidas_det')) {
            Schema::create('cont_partidas_det', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partida_id')->constrained('cont_partidas')->onDelete('cascade');
                $table->foreignId('cuenta_id')->constrained('cont_cuentas')->onDelete('restrict');
                $table->decimal('debe', 15, 2)->default(0);
                $table->decimal('haber', 15, 2)->default(0);
                $table->string('descripcion', 200)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('cont_partidas_det');
        Schema::dropIfExists('cont_partidas');
        Schema::dropIfExists('cont_cuentas');
    }
};
