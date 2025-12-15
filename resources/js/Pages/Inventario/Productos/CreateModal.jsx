import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export default function CreateModal({ isOpen, closeModal, onSuccess, product = null }) {
    const [formData, setFormData] = useState({
        codigo_sku: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        marca_id: '',
        unidad_id: '',
        precio_venta_base: '',
        costo_promedio: 0,
        stock_minimo: 5,
        activo: true
    });

    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchCatalogos();
            if (product) {
                setFormData({
                    codigo_sku: product.codigo_sku,
                    nombre: product.nombre,
                    descripcion: product.descripcion_detallada || '',
                    categoria_id: product.categoria_id || '',
                    marca_id: product.marca_id || '',
                    unidad_id: product.unidad_id || '',
                    precio_venta_base: product.precio_venta_base,
                    costo_promedio: product.costo_promedio,
                    stock_minimo: product.stock_minimo,
                    activo: product.activo
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, product]);

    const fetchCatalogos = async () => {
        try {
            const [catsRes, marcasRes, unidadesRes] = await Promise.all([
                axios.get('/api/inventario/categorias'),
                axios.get('/api/inventario/marcas'),
                axios.get('/api/inventario/unidades')
            ]);
            setCategorias(catsRes.data.data || catsRes.data);
            setMarcas(marcasRes.data.data || marcasRes.data);
            setUnidades(unidadesRes.data.data || unidadesRes.data);
        } catch (error) {
            console.error("Error cargando catálogos", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (product) {
                await axios.put(`/api/inventario/productos/${product.id}`, formData);
            } else {
                await axios.post('/api/inventario/productos', formData);
            }
            setLoading(false);
            resetForm();
            onSuccess();
            closeModal();
        } catch (error) {
            setLoading(false);
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Error guardando producto", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            codigo_sku: '',
            nombre: '',
            descripcion: '',
            categoria_id: '',
            marca_id: '',
            unidad_id: '',
            precio_venta_base: '',
            costo_promedio: 0,
            stock_minimo: 5,
            activo: true
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4"
                                >
                                    {product ? 'Editar Producto' : 'Nuevo Producto'}
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {/* Grid Layout */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* SKU */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU / Código</label>
                                            <input
                                                type="text"
                                                name="codigo_sku"
                                                value={formData.codigo_sku}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                required
                                            />
                                            {errors.codigo_sku && <p className="text-red-500 text-xs mt-1">{errors.codigo_sku[0]}</p>}
                                        </div>

                                        {/* Nombre */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                required
                                            />
                                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre[0]}</p>}
                                        </div>

                                        {/* Categoría */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                                            <select
                                                name="categoria_id"
                                                value={formData.categoria_id}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                required
                                            >
                                                <option value="">Seleccione...</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                                ))}
                                            </select>
                                            {errors.categoria_id && <p className="text-red-500 text-xs mt-1">{errors.categoria_id[0]}</p>}
                                        </div>

                                        {/* Marca */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                                            <select
                                                name="marca_id"
                                                value={formData.marca_id}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                required
                                            >
                                                <option value="">Seleccione...</option>
                                                {marcas.map(marca => (
                                                    <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                                ))}
                                            </select>
                                            {errors.marca_id && <p className="text-red-500 text-xs mt-1">{errors.marca_id[0]}</p>}
                                        </div>

                                        {/* Precio Venta */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Venta (Base)</label>
                                            <div className="relative mt-1 rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    name="precio_venta_base"
                                                    value={formData.precio_venta_base}
                                                    onChange={handleChange}
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            {errors.precio_venta_base && <p className="text-red-500 text-xs mt-1">{errors.precio_venta_base[0]}</p>}
                                        </div>

                                        {/* Unidad */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                                            <select
                                                name="unidad_id"
                                                value={formData.unidad_id}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                                required
                                            >
                                                <option value="">Seleccione...</option>
                                                {unidades.map(u => (
                                                    <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Stock Mínimo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Mínimo</label>
                                            <input
                                                type="number"
                                                name="stock_minimo"
                                                value={formData.stock_minimo}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="mt-8 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                            onClick={closeModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            {loading ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
