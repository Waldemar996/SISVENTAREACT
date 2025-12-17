import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout.jsx'; // Corrected path
import { Head } from '@inertiajs/react';
import ProductTable from '../components/ProductTable.jsx';
import AdjustmentModal from '../components/AdjustmentModal.jsx';
import Button from '../../../shared/ui/Button.jsx';
import Input from '../../../shared/ui/Input.jsx';
import { inventoryService } from '../services/inventoryService';

export default function ProductsPage({ auth }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0 });

    // Adjustment Modal State
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const loadProducts = async () => {
        setLoading(true);
        try {
            // Uncomment when API is ready
            // const response = await inventoryService.getProducts({ 
            //     page: pagination.page, 
            //     search 
            // });
            // setProducts(response.data.data);
            // setPagination({ ...pagination, total: response.data.total });

            // Mock Data for Demo
            setProducts([
                { id: 1, nombre: 'Cemento Progreso 50kg', codigo_sku: 'CEM-001', stock_total: 154, stock_minimo: 20, precio_venta_base: 85.00, categoria: { nombre: 'Materiales' } },
                { id: 2, nombre: 'Hierro 3/8 Legítimo', codigo_sku: 'HIE-038', stock_total: 10, stock_minimo: 50, precio_venta_base: 45.00, categoria: { nombre: 'Materiales' } },
                { id: 3, nombre: 'Clavo Lámina 2.5"', codigo_sku: 'CLA-LAM', stock_total: 500, stock_minimo: 100, precio_venta_base: 0.50, categoria: { nombre: 'Ferretería' } },
            ]);
        } catch (error) {
            console.error("Error loading products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            loadProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, pagination.page]);

    const handleAdjustment = (product) => {
        setSelectedProduct(product);
        setIsAdjustOpen(true);
    };

    const confirmAdjustment = async (data) => {
        // Call Service
        // await inventoryService.createAdjustment(data);
        console.log("Adjustment Data (Audit Ready):", data);
        alert("Ajuste registrado (Simulación). Auditoría creada.");

        // Reload List
        loadProducts();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gestión de Inventario</h2>}
        >
            <Head title="Inventario" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">

                            {/* Toolbar */}
                            <div className="flex justify-between mb-6">
                                <div className="w-1/3">
                                    <Input
                                        placeholder="Buscar producto..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="space-x-2">
                                    <Button variant="primary" onClick={() => alert('New Product Modal')}>
                                        Nuevo Producto
                                    </Button>
                                    <Button variant="secondary" onClick={() => alert('Export')}>
                                        Exportar
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            <ProductTable
                                products={products}
                                loading={loading}
                                onEdit={(p) => alert('Edit ' + p.nombre)}
                                onAdjust={handleAdjustment}
                            />

                            {/* Pagination (Simple) */}
                            <div className="mt-4 flex justify-end">
                                <span className="text-gray-500 text-sm py-2 px-4">Página 1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AdjustmentModal
                isOpen={isAdjustOpen}
                onClose={() => setIsAdjustOpen(false)}
                product={selectedProduct}
                onConfirm={confirmAdjustment}
            />
        </AuthenticatedLayout>
    );
}
