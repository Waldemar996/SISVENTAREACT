<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CQRS Read Model - Ventas optimizado para LECTURAS
     * 
     * Separamos escrituras (oper_ventas) de lecturas (ventas_read_model)
     * 
     * Ventajas:
     * - Queries ultra-rápidas (desnormalizado)
     * - Índices específicos para búsquedas
     * - No afecta performance de escrituras
     * - Escalable (read replicas)
     */
    public function up(): void
    {
        Schema::create('ventas_read_model', function (Blueprint $table) {
            $table->id();
            
            // Referencia a la venta original
            $table->unsignedBigInteger('venta_id')->unique();
            
            // Datos desnormalizados para queries rápidas
            $table->string('numero_comprobante', 50);
            $table->string('tipo_comprobante', 20);
            $table->string('estado', 20);
            $table->index('estado');
            
            // Cliente (desnormalizado)
            $table->unsignedBigInteger('cliente_id');
            $table->string('cliente_nombre', 200);
            $table->string('cliente_nit', 20);
            $table->index('cliente_id');
            
            // Usuario (desnormalizado)
            $table->unsignedBigInteger('usuario_id');
            $table->string('usuario_nombre', 100);
            
            // Fechas
            $table->date('fecha_venta');
            $table->timestamp('fecha_emision');
            $table->index('fecha_venta');
            $table->index('fecha_emision');
            
            // Montos
            $table->decimal('subtotal', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('impuesto', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->index('total');
            
            // Forma de pago
            $table->string('forma_pago', 20);
            $table->index('forma_pago');
            
            // Detalles (JSON para búsqueda)
            $table->json('productos'); // Array de productos vendidos
            $table->integer('cantidad_items');
            $table->integer('cantidad_total_productos');
            
            // Metadata
            $table->string('bodega_nombre', 100)->nullable();
            $table->text('observaciones')->nullable();
            
            // Anulación
            $table->timestamp('fecha_anulacion')->nullable();
            $table->text('motivo_anulacion')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Índices compuestos para queries comunes
            $table->index(['cliente_id', 'fecha_venta'], 'idx_cliente_fecha');
            $table->index(['usuario_id', 'fecha_venta'], 'idx_usuario_fecha');
            $table->index(['estado', 'fecha_venta'], 'idx_estado_fecha');
            $table->index(['forma_pago', 'fecha_venta'], 'idx_pago_fecha');
        });

        // Full-text search en número de comprobante
        DB::statement('CREATE FULLTEXT INDEX idx_numero_fulltext ON ventas_read_model(numero_comprobante)');
    }

    public function down(): void
    {
        Schema::dropIfExists('ventas_read_model');
    }
};
