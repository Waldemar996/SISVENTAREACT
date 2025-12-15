import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react'; // Use router instead of Inertia
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    MagnifyingGlassIcon,
    ShoppingCartIcon,
    TrashIcon,
    PlusIcon,
    MinusIcon,
    UserCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth }) {
    // --- Estados ---
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [clienteId, setClienteId] = useState(1); // Default: Cliente Consumidor Final (ID 1)
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const searchInputRef = useRef(null);

    // --- Efectos ---
    useEffect(() => {
        // Cargar clientes al inicio
        axios.get('/api/comercial/clientes')
            .then(res => setClientes(res.data))
            .catch(err => console.error(err));
    }, []);

    // Búsqueda de productos (Debounce simpe)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busqueda.length > 1) {
                buscarProductos();
            } else {
                setProductos([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [busqueda]);

    const buscarProductos = async () => {
        setLoading(true);
        try {
            // Ajustar url si implementamos filtro backend "api/inventario/productos?q=..."
            // Por ahora traemos todo o usamos una ruta de busqueda especifica
            const response = await axios.get('/api/inventario/productos');
            // Filtrado local temporal hasta tener endpoint de búsqueda avanzado
            const filtered = response.data.data.filter(p =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.codigo_principal.includes(busqueda)
            );
            setProductos(filtered.slice(0, 5)); // Mostrar solo top 5
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica Carrito ---
    const agregarAlCarrito = (producto) => {
        const existente = carrito.find(item => item.producto_id === producto.id);

        if (existente) {
            setCarrito(carrito.map(item =>
                item.producto_id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * item.precio_unitario }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: Number(producto.precio_venta),
                cantidad: 1,
                total: Number(producto.precio_venta)
            }]);
        }
        setBusqueda(''); // Limpiar búsqueda
        searchInputRef.current?.focus(); // Mantener foco
    };

    const actualizarCantidad = (id, delta) => {
        setCarrito(carrito.map(item => {
            if (item.producto_id === id) {
                const nuevaCant = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: nuevaCant, total: nuevaCant * item.precio_unitario };
            }
            return item;
        }));
    };

    const eliminarDelCarrito = (id) => {
        setCarrito(carrito.filter(item => item.producto_id !== id));
    };

    // --- Totales ---
    const subtotal = carrito.reduce((sum, item) => sum + item.total, 0);
    const impuestos = subtotal * 0.12; // Ejemplo IVA 12%
    const total = subtotal; // Si precio incluye IVA o no, ajustar logica

    // --- Procesar Venta ---
    const handleProcesarVenta = async () => {
        if (carrito.length === 0) return;
        setProcesando(true);

        const payload = {
            cliente_id: clienteId,
            bodega_id: 1, // Central
            tipo_comprobante: 'FACTURA', // O boleta según selección
            detalles: carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario
            }))
        };

        try {
            await axios.post('/api/operaciones/ventas', payload);
            alert('Venta procesada exitosamente!');
            setCarrito([]);
            setBusqueda('');
            // Opcional: Redirigir o imprimir ticket
        } catch (error) {
            console.error(error);
            alert('Error al procesar la venta: ' + (error.response?.data?.message || 'Error desconocido'));
        } finally {
            setProcesando(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Punto de Venta</h2>}>
            <Head title="Nueva Venta" />

            <div className="flex h-[calc(100vh-10rem)] gap-4">

                {/* --- IZQUIERDA: Buscador y Catálogo --- */}
                <div className="w-2/3 flex flex-col gap-4">
                    {/* Barra Búsqueda */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 text-lg bg-gray-50 dark:bg-gray-900 dark:text-white"
                                placeholder="Escanear código o buscar producto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Resultados Búsqueda / Favoritos */}
                    <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                            {busqueda ? 'Resultados de búsqueda' : 'Productos Recientes'}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {productos.map(producto => (
                                <button
                                    key={producto.id}
                                    onClick={() => agregarAlCarrito(producto)}
                                    className="flex flex-col items-start p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all bg-gray-50 dark:bg-gray-700/50 text-left group"
                                >
                                    <div className="w-full aspect-square bg-gray-200 dark:bg-gray-600 rounded-md mb-2 flex items-center justify-center">
                                        {/* Placeholder imagen */}
                                        <span className="text-2xl">📦</span>
                                    </div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-2 leading-tight mb-1">
                                        {producto.nombre}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-2">{producto.codigo_principal}</span>
                                    <div className="mt-auto w-full flex justify-between items-center">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            Q{Number(producto.precio_venta).toFixed(2)}
                                        </span>
                                        <div className="bg-blue-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlusIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {productos.length === 0 && busqueda.length > 1 && (
                                <div className="col-span-full text-center py-10 text-gray-400">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- DERECHA: Carrito y Totales --- */}
                <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">

                    {/* Header Factura */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                <UserCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 uppercase">Cliente</label>
                                <select
                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer"
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                >
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.razon_social}</option>
                                    ))}
                                    <option value="new">+ Nuevo Cliente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lista Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {carrito.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <ShoppingCartIcon className="w-16 h-16 opacity-20" />
                                <p>El carrito está vacío</p>
                            </div>
                        ) : (
                            carrito.map((item) => (
                                <div key={item.producto_id} className="flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 p-2 rounded-lg transition-colors group relative">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                            {item.nombre}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">
                                                Q{item.precio_unitario.toFixed(2)} x
                                            </span>
                                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900">
                                                <button
                                                    onClick={() => actualizarCantidad(item.producto_id, -1)}
                                                    className="p-1 hover:text-red-500"
                                                >
                                                    <MinusIcon className="w-3 h-3" />
                                                </button>
                                                <span className="px-2 text-xs font-semibold w-8 text-center">{item.cantidad}</span>
                                                <button
                                                    onClick={() => actualizarCantidad(item.producto_id, 1)}
                                                    className="p-1 hover:text-green-500"
                                                >
                                                    <PlusIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            Q{item.total.toFixed(2)}
                                        </p>
                                        <button
                                            onClick={() => eliminarDelCarrito(item.producto_id)}
                                            className="text-gray-300 hover:text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totales y Botón Pago */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>Q{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Impuestos</span>
                            <span>Q0.00</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>Q{total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleProcesarVenta}
                            disabled={carrito.length === 0 || procesando}
                            className={`
                                w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg text-white shadow-lg transition-all
                                ${carrito.length === 0 || procesando
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-blue-500/30'}
                            `}
                        >
                            {procesando ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-6 h-6" />
                                    Cobrar Q{total.toFixed(2)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* CSS para ocultar Scrollbar en paneles pero permitir scroll */}
            <style jsx>{`
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
