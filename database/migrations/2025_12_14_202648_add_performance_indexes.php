<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * PERFORMANCE INDEXES - Sprint 1
     * Mejora estimada: +300% en queries frecuentes
     */
    public function up(): void
    {
        // ========================================
        // VENTAS - Queries más frecuentes
        // ========================================
        Schema::table('oper_ventas', function (Blueprint $table) {
            if (!$this->indexExists('oper_ventas', 'idx_ventas_estado_fecha')) {
                $table->index(['estado', 'fecha_emision'], 'idx_ventas_estado_fecha');
            }
            if (!$this->indexExists('oper_ventas', 'idx_ventas_cliente_estado')) {
                $table->index(['cliente_id', 'estado'], 'idx_ventas_cliente_estado');
            }
            if (!$this->indexExists('oper_ventas', 'idx_ventas_numero')) {
                $table->index('numero_comprobante', 'idx_ventas_numero');
            }
            if (!$this->indexExists('oper_ventas', 'idx_ventas_usuario')) {
                $table->index('usuario_id', 'idx_ventas_usuario');
            }
        });

        // ========================================
        // COMPRAS
        // ========================================
        Schema::table('oper_compras', function (Blueprint $table) {
            if (!$this->indexExists('oper_compras', 'idx_compras_estado_fecha')) {
                $table->index(['estado', 'fecha_emision'], 'idx_compras_estado_fecha');
            }
            if (!$this->indexExists('oper_compras', 'idx_compras_proveedor_estado')) {
                $table->index(['proveedor_id', 'estado'], 'idx_compras_proveedor_estado');
            }
            if (!$this->indexExists('oper_compras', 'idx_compras_numero')) {
                $table->index('numero_comprobante', 'idx_compras_numero');
            }
        });

        // ========================================
        // KARDEX
        // ========================================
        Schema::table('inv_kardex', function (Blueprint $table) {
            if (!$this->indexExists('inv_kardex', 'idx_kardex_producto_bodega_fecha')) {
                $table->index(['producto_id', 'bodega_id', 'fecha'], 'idx_kardex_producto_bodega_fecha');
            }
            if (!$this->indexExists('inv_kardex', 'idx_kardex_referencia')) {
                $table->index(['referencia_tipo', 'referencia_id'], 'idx_kardex_referencia');
            }
            if (!$this->indexExists('inv_kardex', 'idx_kardex_tipo')) {
                $table->index('tipo_movimiento', 'idx_kardex_tipo');
            }
        });

        // ========================================
        // PRODUCTOS
        // ========================================
        Schema::table('inv_productos', function (Blueprint $table) {
            if (!$this->indexExists('inv_productos', 'idx_productos_sku')) {
                $table->index('codigo_sku', 'idx_productos_sku');
            }
            if (!$this->indexExists('inv_productos', 'idx_productos_activo_categoria')) {
                $table->index(['activo', 'categoria_id'], 'idx_productos_activo_categoria');
            }
            if (!$this->indexExists('inv_productos', 'idx_productos_nombre')) {
                $table->index('nombre', 'idx_productos_nombre');
            }
        });

        // ========================================
        // STOCK POR BODEGA
        // ========================================
        Schema::table('inv_bodega_producto', function (Blueprint $table) {
            if (!$this->indexExists('inv_bodega_producto', 'idx_stock_producto_bodega')) {
                $table->index(['producto_id', 'bodega_id'], 'idx_stock_producto_bodega');
            }
            if (!$this->indexExists('inv_bodega_producto', 'idx_stock_bodega')) {
                $table->index('bodega_id', 'idx_stock_bodega');
            }
        });

        // ========================================
        // CLIENTES
        // ========================================
        Schema::table('com_clientes', function (Blueprint $table) {
            if (!$this->indexExists('com_clientes', 'idx_clientes_nit')) {
                $table->index('nit', 'idx_clientes_nit');
            }
            if (!$this->indexExists('com_clientes', 'idx_clientes_activo')) {
                $table->index('activo', 'idx_clientes_activo');
            }
        });

        // ========================================
        // PROVEEDORES
        // ========================================
        Schema::table('com_proveedores', function (Blueprint $table) {
            if (!$this->indexExists('com_proveedores', 'idx_proveedores_nit')) {
                $table->index('nit', 'idx_proveedores_nit');
            }
            if (!$this->indexExists('com_proveedores', 'idx_proveedores_activo')) {
                $table->index('activo', 'idx_proveedores_activo');
            }
        });

        // ========================================
        // DETALLES DE VENTA
        // ========================================
        Schema::table('oper_ventas_det', function (Blueprint $table) {
            if (!$this->indexExists('oper_ventas_det', 'idx_ventas_det_venta')) {
                $table->index('venta_id', 'idx_ventas_det_venta');
            }
            if (!$this->indexExists('oper_ventas_det', 'idx_ventas_det_producto')) {
                $table->index('producto_id', 'idx_ventas_det_producto');
            }
        });

        // ========================================
        // DETALLES DE COMPRA
        // ========================================
        Schema::table('oper_compras_det', function (Blueprint $table) {
            if (!$this->indexExists('oper_compras_det', 'idx_compras_det_compra')) {
                $table->index('compra_id', 'idx_compras_det_compra');
            }
            if (!$this->indexExists('oper_compras_det', 'idx_compras_det_producto')) {
                $table->index('producto_id', 'idx_compras_det_producto');
            }
        });
    }
    
    /**
     * Helper method to check if an index exists
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oper_ventas', function (Blueprint $table) {
            $table->dropIndex('idx_ventas_estado_fecha');
            $table->dropIndex('idx_ventas_cliente_estado');
            $table->dropIndex('idx_ventas_numero');
            $table->dropIndex('idx_ventas_usuario');
        });

        Schema::table('oper_compras', function (Blueprint $table) {
            $table->dropIndex('idx_compras_estado_fecha');
            $table->dropIndex('idx_compras_proveedor_estado');
            $table->dropIndex('idx_compras_numero');
        });

        Schema::table('inv_kardex', function (Blueprint $table) {
            $table->dropIndex('idx_kardex_producto_bodega_fecha');
            $table->dropIndex('idx_kardex_referencia');
            $table->dropIndex('idx_kardex_tipo');
        });

        Schema::table('inv_productos', function (Blueprint $table) {
            $table->dropIndex('idx_productos_sku');
            $table->dropIndex('idx_productos_activo_categoria');
            $table->dropIndex('idx_productos_nombre');
        });

        Schema::table('inv_bodega_producto', function (Blueprint $table) {
            $table->dropIndex('idx_stock_producto_bodega');
            $table->dropIndex('idx_stock_bodega');
        });

        Schema::table('com_clientes', function (Blueprint $table) {
            $table->dropIndex('idx_clientes_nit');
            $table->dropIndex('idx_clientes_activo');
        });

        Schema::table('com_proveedores', function (Blueprint $table) {
            $table->dropIndex('idx_proveedores_nit');
            $table->dropIndex('idx_proveedores_activo');
        });

        Schema::table('oper_ventas_det', function (Blueprint $table) {
            $table->dropIndex('idx_ventas_det_venta');
            $table->dropIndex('idx_ventas_det_producto');
        });

        Schema::table('oper_compras_det', function (Blueprint $table) {
            $table->dropIndex('idx_compras_det_compra');
            $table->dropIndex('idx_compras_det_producto');
        });
    }
};
