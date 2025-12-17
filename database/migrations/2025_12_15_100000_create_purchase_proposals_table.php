<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('com_propuestas_compra', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('inv_productos')->onDelete('cascade');
            $table->foreignId('proveedor_id')->nullable()->constrained('com_proveedores')->onDelete('set null');

            // Datos del cálculo
            $table->decimal('stock_actual', 10, 2);
            $table->decimal('prediccion_demanda', 10, 2);
            $table->decimal('cantidad_sugerida', 10, 2);

            // Justificación IA
            $table->string('prioridad', 20); // 'CRITICA', 'ALTA', 'NORMAL'
            $table->text('razon_ia')->nullable(); // Explicación legible "Stock 5 < 40"
            $table->decimal('confianza_ia', 5, 2); // Score del algoritmo

            // Estado del flujo humano
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente');
            $table->timestamp('fecha_decision')->nullable();

            // Link a la compra real si se aprueba
            $table->foreignId('orden_compra_generada_id')->nullable()->constrained('oper_compras');

            $table->timestamps();

            // Índices
            $table->index('estado');
            $table->index('prioridad');
        });
    }

    public function down()
    {
        Schema::dropIfExists('com_propuestas_compra');
    }
};
