<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inv_predicciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('inv_productos')->onDelete('cascade');
            $table->date('fecha_objetivo'); // El mes que estamos prediciendo
            $table->decimal('cantidad_predicha', 10, 2); // Cuánto creemos que se venderá
            $table->decimal('confianza_score', 5, 2)->nullable(); // 0-100% de confianza
            $table->string('algoritmo', 50)->default('LinearRegression');
            $table->json('datos_input')->nullable(); // Guardamos los datos usados para debug
            $table->timestamps();

            // Índices para consultas rápidas
            $table->index(['producto_id', 'fecha_objetivo']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('inv_predicciones');
    }
};
