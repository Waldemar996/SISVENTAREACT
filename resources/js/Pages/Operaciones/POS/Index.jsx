import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon,
    CreditCardIcon, BanknotesIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import SearchableSelect from '@/Components/UI/SearchableSelect';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function Index({ auth }) {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState('all');
    const [carrito, setCarrito] = useState([]);
    const [cliente, setCliente] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [clientes, setClientes] = useState([]); // Add clients state

    const searchInputRef = useRef(null);

    useEffect(() => { fetchData(); }, []);

    // Auto-focus on mount
    useEffect(() => {
        if (!loading && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [loading]);

    const fetchData = async () => {
        try {
            const [prodRes, catRes, cliRes] = await Promise.all([
                axios.get('/api/inventario/productos?all=true'),
                axios.get('/api/inventario/categorias'),
                axios.get('/api/comercial/clientes?all=true')
            ]);

            // Defensive: Handle Pagination Object vs Array
            const prodData = prodRes.data.data || prodRes.data;
            if (Array.isArray(prodData)) {
                setProductos(prodData);
                console.log("POS: Productos cargados", prodData.length);
            } else {
                console.error("POS: Formato de productos incorrecto", prodRes.data);
                setProductos([]);
            }

            setCategorias(catRes.data);

            // Handle Clients
            const cliData = cliRes.data.data || cliRes.data;
            setClientes(Array.isArray(cliData) ? cliData : []);

            // Default to first client (usually CF) if available
            if (Array.isArray(cliData) && cliData.length > 0) {
                // Try to find "Consumidor Final" or C/F or similar, otherwise first
                const cf = cliData.find(c => c.razon_social?.match(/consumidor/i)) || cliData[0];
                setCliente(cf);
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const filteredProductos = Array.isArray(productos) ? productos.filter(p => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (p.nombre || '').toLowerCase().includes(term) ||
            (p.codigo_sku || '').toLowerCase().includes(term);
        const matchesCategoria = selectedCategoria === 'all' || p.categoria_id == selectedCategoria;
        // Verify active status and stock just in case
        return matchesSearch && matchesCategoria && p.activo !== 0;
    }) : [];

    const agregarAlCarrito = (producto) => {
        // Prevent adding if no global stock
        if (producto.stock_total <= 0) {
            toast.error('Producto sin stock disponible');
            return;
        }

        const existente = carrito.find(item => item.id === producto.id);
        if (existente) {
            if (existente.cantidad < producto.stock_total) {
                setCarrito(carrito.map(item =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                ));
            } else {
                toast.error('Stock insuficiente');
            }
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }

        // Clear search term AND focus back to scanner (For both Click and Scan actions)
        setSearchTerm('');
        setTimeout(() => {
            if (searchInputRef.current) searchInputRef.current.focus();
        }, 50);
    };

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        const producto = productos.find(p => p.id === productoId);
        if (nuevaCantidad > producto.stock_total) {
            toast.error('Stock insuficiente');
            return;
        }
        if (nuevaCantidad <= 0) {
            removerDelCarrito(productoId);
            return;
        }
        setCarrito(carrito.map(item =>
            item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
        ));
    };

    const removerDelCarrito = (productoId) => {
        setCarrito(carrito.filter(item => item.id !== productoId));
    };

    const calcularTotal = () => {
        return carrito.reduce((sum, item) => sum + (item.precio_venta_base * item.cantidad), 0);
    };

    const procesarVenta = async (metodoPago) => {
        if (carrito.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        if (!cliente) {
            toast.error('Seleccione un cliente (o Consumidor Final)');
            return;
        }

        setProcessing(true);
        try {
            const ventaData = {
                cliente_id: cliente.id,
                bodega_id: 1, // Explicitly send Bodega 1 (Central)
                metodo_pago: metodoPago,
                tipo_comprobante: 'TICKET', // Required by backend
                detalles: carrito.map(item => ({
                    producto_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_venta_base
                }))
            };

            const res = await axios.post('/api/operaciones/ventas', ventaData);
            toast.success('Venta procesada correctamente');
            setCarrito([]);
            // Don't clear client, keep for next sale (speed)
            fetchData(); // Refresh stock

            // Re-focus scanner
            if (searchInputRef.current) searchInputRef.current.focus();

            // Auto-Print Ticket
            if (res.data && res.data.id) {
                window.open(`/operaciones/ventas/${res.data.id}/ticket`, '_blank');
            }

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error al procesar venta';
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Punto de Venta (POS)" />

            <PageHeader
                title="Punto de Venta"
                breadcrumbs={[
                    { label: 'Operaciones', href: route('dashboard') },
                    { label: 'POS' }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Productos */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const term = searchTerm.trim().toLowerCase();
                                            if (!term) return;

                                            // 1. Try Exact SKU Match first
                                            const exactMatch = productos.find(p => p.codigo_sku?.toLowerCase() === term);

                                            // 2. If not, try Exact Name Match
                                            const nameMatch = productos.find(p => p.nombre.toLowerCase() === term);

                                            const target = exactMatch || nameMatch;

                                            if (target) {
                                                agregarAlCarrito(target);
                                                // searchTerm cleared in agregarAlCarrito
                                                toast.success(`Agregado: ${target.nombre}`);
                                            } else {
                                                // If only 1 result in filtered list, add it (Smart Scan)
                                                if (filteredProductos.length === 1) {
                                                    agregarAlCarrito(filteredProductos[0]);
                                                    // searchTerm cleared in agregarAlCarrito
                                                    toast.success(`Agregado: ${filteredProductos[0].nombre}`);
                                                }
                                            }
                                        }
                                    }}
                                    placeholder="Buscar producto o Escanear Código..."
                                    className="block w-full rounded-lg border-secondary-300 pl-10 focus:border-primary-500 focus:ring-primary-500"
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ShoppingCartIcon className="h-5 w-5 text-secondary-400" />
                                </div>
                            </div>
                            <select
                                value={selectedCategoria}
                                onChange={(e) => setSelectedCategoria(e.target.value)}
                                className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="all">Todas las categorías</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <LoadingSpinner className="py-12" />
                        ) : filteredProductos.length === 0 ? (
                            <div className="text-center py-12 text-secondary-500">
                                <p className="text-lg font-medium">No se encontraron productos</p>
                                <p className="text-sm">Intenta con otro término o categoría</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                                {filteredProductos.map((producto) => (
                                    <button
                                        key={producto.id}
                                        onClick={() => agregarAlCarrito(producto)}
                                        className="p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                                    >
                                        <div className="aspect-square bg-secondary-100 rounded-lg mb-3 flex items-center justify-center">
                                            <ShoppingCartIcon className="h-12 w-12 text-secondary-400" />
                                        </div>
                                        <h3 className="font-semibold text-secondary-900 text-sm mb-1 line-clamp-2">
                                            {producto.nombre}
                                        </h3>
                                        <p className="text-xs text-secondary-500 mb-2">{producto.codigo_sku}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-primary-600">
                                                {formatCurrency(producto.precio_venta_base)}
                                            </span>
                                            <Badge variant={producto.stock_total > producto.stock_minimo ? 'success' : 'warning'} size="sm">
                                                Stock: {producto.stock_total}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Carrito */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <SearchableSelect
                                items={clientes}
                                selectedId={cliente?.id}
                                onChange={(id) => {
                                    const c = clientes.find(cl => cl.id == id);
                                    setCliente(c);
                                }}
                                placeholder="Buscar Cliente..."
                                displayKey="razon_social"
                                secondaryKey="nit"
                            />
                        </div>

                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-200">
                            <h2 className="text-lg font-semibold text-secondary-900">Carrito de Venta</h2>
                            {carrito.length > 0 && (
                                <button
                                    onClick={() => setCarrito([])}
                                    className="text-danger-600 hover:text-danger-900"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                            {carrito.length === 0 ? (
                                <p className="text-center text-secondary-500 py-8">Carrito vacío</p>
                            ) : (
                                carrito.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-secondary-900 text-sm">{item.nombre}</p>
                                            <p className="text-xs text-secondary-500">{formatCurrency(item.precio_venta_base)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                                className="p-1 rounded bg-secondary-200 hover:bg-secondary-300"
                                            >
                                                <MinusIcon className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                                className="p-1 rounded bg-secondary-200 hover:bg-secondary-300"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => removerDelCarrito(item.id)}
                                                className="p-1 rounded bg-danger-100 hover:bg-danger-200 text-danger-600"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-secondary-200 pt-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-secondary-600">Subtotal:</span>
                                <span className="font-semibold">{formatCurrency(calcularTotal())}</span>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-lg font-bold text-secondary-900">Total:</span>
                                <span className="text-2xl font-bold text-primary-600">{formatCurrency(calcularTotal())}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={() => procesarVenta('efectivo')}
                                disabled={carrito.length === 0 || processing}
                                loading={processing}
                                className="w-full"
                                variant="success"
                            >
                                <BanknotesIcon className="h-5 w-5 mr-2" />
                                Pagar en Efectivo
                            </Button>
                            <Button
                                onClick={() => procesarVenta('tarjeta')}
                                disabled={carrito.length === 0 || processing}
                                loading={processing}
                                className="w-full"
                                variant="primary"
                            >
                                <CreditCardIcon className="h-5 w-5 mr-2" />
                                Pagar con Tarjeta
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
