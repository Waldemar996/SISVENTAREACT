import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout.jsx';
import { Head } from '@inertiajs/react';
import ProductSearch from '../components/ProductSearch.jsx';
import Cart from '../components/Cart.jsx';
import Button from '../../../shared/ui/Button.jsx';
import { salesService } from '../services/salesService';

export default function POSPage({ auth }) {
    const [cart, setCart] = useState([]);
    const [totals, setTotals] = useState({
        subtotal: 0,
        impuestos: 0,
        total: 0
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (cart.length === 0) {
            setTotals({ subtotal: 0, impuestos: 0, total: 0 });
            return;
        }

        const calculate = async () => {
            try {
                // In production, uncomment this to enable backend calculation
                // const response = await salesService.calculateTotals(cart);
                // setTotals(response.data);

                // For demo/fallback if backend endpoint not yet ready:
                const sub = cart.reduce((acc, item) => acc + (item.precio_venta_base * item.cantidad), 0);
                setTotals({
                    subtotal: sub,
                    impuestos: sub * 0.12, // Dummy tax
                    total: sub * 1.12
                });

            } catch (error) {
                console.error("Error calculating totals", error);
            }
        };

        const timer = setTimeout(() => {
            calculate();
        }, 500);

        return () => clearTimeout(timer);
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cantidad: 1 }];
        });
    };

    const updateQuantity = (id, newQty) => {
        setCart(prev => prev.map(item =>
            item.id === id ? { ...item, cantidad: newQty } : item
        ));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const payload = {
                items: cart.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
                cliente_id: 1, // Default CF/Consumer
                bodega_id: 1,
                tipo_comprobante: 'FACTURA'
            };

            await salesService.createSale(payload);
            alert("Venta procesada con éxito!");
            setCart([]);
            setTotals({ total: 0, impuestos: 0, subtotal: 0 });
        } catch (error) {
            alert("Error al procesar venta: " + (error.response?.data?.message || (error.message || "Error desconocido")));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Punto de Venta (POS) - Enterprise</h2>}
        >
            <Head title="POS Enterprise" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Col: Search & Cart */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white p-4 shadow sm:rounded-lg">
                                {/* Search Component */}
                                <ProductSearch onProductSelect={addToCart} />
                            </div>

                            <div className="bg-white p-4 shadow sm:rounded-lg min-h-[400px]">
                                {/* Cart Component */}
                                <Cart
                                    items={cart}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeFromCart}
                                />
                            </div>
                        </div>

                        {/* Right Col: Totals & Actions */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-6 shadow sm:rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Resumen</h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">Q{Number(totals.subtotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Impuestos</span>
                                        <span className="font-medium">Q{Number(totals.impuestos).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-3 mt-3">
                                        <span className="text-base font-bold text-gray-900">Total a Pagar</span>
                                        <span className="text-xl font-bold text-blue-600">Q{Number(totals.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <Button
                                        variant="primary"
                                        className="w-full h-12 text-lg"
                                        onClick={handleCheckout}
                                        disabled={processing || cart.length === 0}
                                        loading={processing}
                                    >
                                        COBRAR
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => setCart([])}
                                        disabled={processing || cart.length === 0}
                                    >
                                        Cancelar / Limpiar
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
