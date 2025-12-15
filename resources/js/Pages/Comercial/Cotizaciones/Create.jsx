import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

export default function Create({ auth }) {
    // Data Sources
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);

    // Form Head
    const [clienteId, setClienteId] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 7 days

    // Form Details
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const [clientRes, prodRes] = await Promise.all([
                axios.get('/api/comercial/clientes'),
                axios.get('/api/inventario/productos')
            ]);
            setClientes(clientRes.data.data || clientRes.data); // Handle potential paginated response
            setProductos(prodRes.data.data || prodRes.data);
        } catch (error) {
            console.error("Error loading resources", error);
        }
    };

    const addToCart = (producto) => {
        setCart(current => {
            const exists = current.find(item => item.id === producto.id);
            if (exists) {
                return current.map(item => item.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_venta_base }
                    : item
                );
            }
            return [...current, { ...producto, cantidad: 1, subtotal: Number(producto.precio_venta_base) }];
        });
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const changeQuantity = (index, qty) => {
        if (qty < 1) return;
        setCart(current => {
            const newCart = [...current];
            newCart[index].cantidad = qty;
            newCart[index].subtotal = qty * newCart[index].precio_venta_base;
            return newCart;
        });
    };

    const filteredAndAvailableProducts = productos.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo_sku.toLowerCase().includes(search.toLowerCase())
    );

    const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

    const handleSubmit = async () => {
        if (!clienteId) return alert("Seleccione un cliente");
        if (cart.length === 0) return alert("Agregue productos");

        setLoading(true);
        try {
            const payload = {
                cliente_id: clienteId,
                fecha_vencimiento: fechaVencimiento,
                detalles: cart.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta_base
                }))
            };

            await axios.post('/api/comercial/cotizaciones', payload);
            alert("Cotización Creada Exitosamente");
            router.visit(route('comercial.cotizaciones'));
        } catch (error) {
            alert("Error al guardar cotización");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Nueva Cotización</h2>}>
            <Head title="Crear Cotización" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex flex-col md:flex-row gap-6">

                {/* Left Panel: Catalog */}
                <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-4 flex flex-col">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre o SKU..."
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                        {filteredAndAvailableProducts.map(prod => (
                            <div key={prod.id} className="border rounded-lg p-3 hover:shadow-md cursor-pointer flex flex-col justify-between bg-gray-50 transition" onClick={() => addToCart(prod)}>
                                <div>
                                    <div className="h-24 bg-gray-200 mb-2 rounded flex items-center justify-center text-gray-400">
                                        IMG
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900 truncate">{prod.nombre}</h4>
                                    <p className="text-xs text-gray-500">{prod.codigo_sku}</p>
                                </div>
                                <div className="mt-2 text-indigo-600 font-bold text-right">
                                    Q{Number(prod.precio_venta_base).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Quote Builder */}
                <div className="w-full md:w-1/3 bg-white shadow-xl rounded-lg flex flex-col">
                    <div className="p-4 border-b bg-indigo-50 rounded-t-lg">
                        <h3 className="font-bold text-lg text-indigo-900 mb-4">Detalles de Cotización</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Cliente</label>
                                <select
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm"
                                    value={clienteId}
                                    onChange={e => setClienteId(e.target.value)}
                                >
                                    <option value="">Seleccione Cliente...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social} ({c.nit})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Válida Hasta</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                    value={fechaVencimiento}
                                    onChange={e => setFechaVencimiento(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">Agregue productos del catálogo</div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-2">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{item.nombre}</div>
                                        <div className="text-xs text-gray-500">Q{item.precio_venta_base} unit.</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            className="w-16 h-8 text-center border-gray-300 rounded text-sm p-1"
                                            value={item.cantidad}
                                            onChange={(e) => changeQuantity(idx, parseInt(e.target.value))}
                                            min="1"
                                        />
                                        <div className="w-20 text-right font-bold text-sm">Q{Number(item.subtotal).toFixed(2)}</div>
                                        <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700">✕</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-800">Total Estimado</span>
                            <span className="text-2xl font-bold text-indigo-700">Q{cartTotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 transition transform active:scale-95"
                        >
                            {loading ? 'Guardando...' : 'GUARDAR COTIZACIÓN'}
                        </button>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
