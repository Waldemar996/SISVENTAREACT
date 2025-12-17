<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Event Store - Almacena TODOS los eventos del sistema
     *
     * Esto es la base de Event Sourcing:
     * - Auditoría completa
     * - Time travel (reconstruir estado en cualquier momento)
     * - Analytics avanzado
     * - Compliance perfecto
     */
    public function up(): void
    {
        Schema::create('event_store', function (Blueprint $table) {
            $table->id();

            // Identificador del agregado (ej: venta_123)
            $table->string('aggregate_type', 100); // 'venta', 'compra', 'producto'
            $table->string('aggregate_id', 100);
            $table->index(['aggregate_type', 'aggregate_id'], 'idx_aggregate');

            // Tipo de evento
            $table->string('event_type', 200); // 'VentaCreadaEvent', 'VentaAnuladaEvent'
            $table->index('event_type');

            // Datos del evento (JSON)
            $table->json('event_data');

            // Metadata
            $table->json('metadata')->nullable(); // user_id, ip, etc.

            // Versioning (para optimistic locking)
            $table->unsignedBigInteger('version')->default(1);
            $table->unique(['aggregate_type', 'aggregate_id', 'version'], 'unique_version');

            // Timestamp
            $table->timestamp('occurred_at')->useCurrent();
            $table->index('occurred_at');

            // Usuario que generó el evento
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('sys_usuarios');

            // Timestamps de Laravel
            $table->timestamps();
        });

        // Índice para queries por rango de tiempo
        Schema::table('event_store', function (Blueprint $table) {
            $table->index(['aggregate_type', 'occurred_at'], 'idx_type_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_store');
    }
};
