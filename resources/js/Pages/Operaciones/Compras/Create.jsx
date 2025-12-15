import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth }) {
    const [proveedores, setProveedores] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(false);

    // Formulario principal
    const { data, setData, post, processing, errors, reset } = useForm({
        proveedor_id: '',
        bodega_id: '', // Se llenará con la primera bodega encontrada
        tipo_comprobante: 'FACTURA',
        no_factura: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        detalles: []
    });

    useEffect(() => {
        cargarCatalogos();
        buscarProductos();
    }, []);

    const cargarCatalogos = async () => {
        try {
            const [provRes, bodRes] = await Promise.all([
                axios.get('/api/comercial/proveedores'),
                axios.get('/api/inventario/bodegas')
            ]);
            setProveedores(provRes.data.data || provRes.data);
            const bods = bodRes.data.data || bodRes.data;
            setBodegas(bods);
            if (bods.length > 0) {
                setData('bodega_id', bods[0].id);
            }
        } catch (error) {
            console.error("Error cargando catálogos", error);
        }
    };

    const buscarProductos = async (query = '') => {
        try {
            // Nota: En un sistema real usaríamos debounce y un endpoint de búsqueda específico
            const response = await axios.get('/api/inventario/productos?page=1');
            // Filtro local simple por ahora si el API no soporta search param aún
            const allProds = response.data.data;
            if (query) {
                const filtered = allProds.filter(p =>
                    p.nombre.toLowerCase().includes(query.toLowerCase()) ||
                    p.codigo_sku.toLowerCase().includes(query.toLowerCase())
                );
                setProductos(filtered);
            } else {
                setProductos(allProds);
            }
        } catch (error) {
            console.error("Error buscando productos", error);
        }
    };

    const addToCart = (producto) => {
        const existing = carrito.find(p => p.producto_id === producto.id);
        if (existing) {
            setCarrito(carrito.map(p =>
                p.producto_id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1, total: (p.cantidad + 1) * p.costo_unitario }
                    : p
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: producto.id,
                nombre: producto.nombre,
                codigo: producto.codigo_sku,
                cantidad: 1,
                costo_unitario: parseFloat(producto.costo_promedio) || 0,
                total: parseFloat(producto.costo_promedio) || 0
            }]);
        }
    };

    const updateCartItem = (id, field, value) => {
        setCarrito(carrito.map(item => {
            if (item.producto_id === id) {
                const newData = { ...item, [field]: parseFloat(value) || 0 };
                // Recalcular total si cambia cantidad o costo
                newData.total = newData.cantidad * newData.costo_unitario;
                return newData;
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCarrito(carrito.filter(item => item.producto_id !== id));
    };

    const calculateTotal = () => {
        return carrito.reduce((acc, item) => acc + item.total, 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Sincronizar carrito con form data antes de enviar (transformando claves a lo que espera el controller)
        // El controller espera: producto_id, cantidad, costo_unitario (no precio_unitario para compras)
        // Controller: 'detalles' array

        data.detalles = carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            costo_unitario: item.costo_unitario
        }));

        data.total_compra = calculateTotal(); // Aunque el backend recalcula, enviamos por si acaso
        data.numero_comprobante = data.no_factura; // Alias para compatibilidad

        post(route('operaciones.compras.store'), {
            onSuccess: () => {
                alert('Compra registrada exitosamente');
                setCarrito([]);
                reset();
                // idealmente redirigir al index de compras
            },
            onError: (err) => {
                console.error(err);
                alert('Error al registrar compra. Verifique los datos.');
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Registrar Nueva Compra</h2>}
        >
            <Head title="Nueva Compra" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN: PRODUCT SELECTION */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Product Search */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Buscar producto a comprar (Nombre, SKU)..."
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            buscarProductos(e.target.value);
                                        }}
                                    />
                                </div>

                                {/* Results Grid */}
                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                    {productos.map(prod => (
                                        <div
                                            key={prod.id}
                                            onClick={() => addToCart(prod)}
                                            className="cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-500 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-150"
                                        >
                                            <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{prod.nombre}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                                                <span>{prod.codigo_sku}</span>
                                                <span>Stock: ?</span>
                                            </div>
                                            <div className="text-sm font-bold text-blue-600 mt-2">
                                                Costo Prom: Q{parseFloat(prod.costo_promedio).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cart / Shopping List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        <ShoppingCartIcon className="w-5 h-5" />
                                        Detalle de Compra
                                    </h3>
                                    <span className="text-sm text-gray-500">{carrito.length} Ítems</span>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3">Producto</th>
                                                <th className="px-4 py-3 w-24 text-center">Cant.</th>
                                                <th className="px-4 py-3 w-32 text-right">Costo Unit.</th>
                                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {carrito.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                                                        No hay productos seleccionados
                                                    </td>
                                                </tr>
                                            ) : (
                                                carrito.map(item => (
                                                    <tr key={item.producto_id} className="bg-white dark:bg-gray-800">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                            <div>{item.nombre}</div>
                                                            <div className="text-xs text-gray-400">{item.codigo}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-full text-center rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                                                value={item.cantidad}
                                                                onChange={(e) => updateCartItem(item.producto_id, 'cantidad', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="w-full text-right rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                                                value={item.costo_unitario}
                                                                onChange={(e) => updateCartItem(item.producto_id, 'costo_unitario', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                                            Q{item.total.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFromCart(item.producto_id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        {carrito.length > 0 && (
                                            <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold text-gray-900 dark:text-white">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-3 text-right">TOTAL COMPRA:</td>
                                                    <td className="px-4 py-3 text-right text-lg text-blue-600">
                                                        Q{calculateTotal().toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: INVOICE DETAILS */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit space-y-6">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-2">
                                Datos Factura
                            </h3>

                            {/* Proveedor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Proveedor *
                                </label>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                    value={data.proveedor_id}
                                    onChange={e => setData('proveedor_id', e.target.value)}
                                    required
                                >
                                    <option value="">Seleccione Proveedor</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.razon_social} ({p.nit})
                                        </option>
                                    ))}
                                </select>
                                {errors.proveedor_id && <p className="text-red-500 text-xs mt-1">{errors.proveedor_id}</p>}
                            </div>

                            {/* Bodega Destino */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Bodega Destino *
                                </label>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                    value={data.bodega_id}
                                    onChange={e => setData('bodega_id', e.target.value)}
                                    required
                                >
                                    {bodegas.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                        value={data.fecha_emision}
                                        onChange={e => setData('fecha_emision', e.target.value)}
                                    />
                                </div>
                                {/* No. Factura */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        No. Factura
                                    </label>
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                        value={data.no_factura}
                                        onChange={e => setData('no_factura', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing || carrito.length === 0}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Procesando...' : 'FINALIZAR COMPRA'}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
