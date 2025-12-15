import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, CubeIcon,
    Squares2X2Icon, ListBulletIcon, PhotoIcon
} from '@heroicons/react/24/outline';

import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [productos, setProductos] = useState({ data: [], links: [], meta: {} });
    const [categorias, setCategorias] = useState([]);

    const [marcas, setMarcas] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        codigo_sku: '',
        nombre: '',
        descripcion_corta: '',
        categoria_id: '',
        marca_id: '',
        precio_venta_base: '',
        costo_promedio: '',
        stock_minimo: '5',
        stock_maximo: '100',
        unidad_id: '',
        controla_stock: true,
        usa_lotes: false,
        activo: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const [prodRes, catRes, marRes, uniRes] = await Promise.all([
                axios.get(`/api/inventario/productos?page=${page}&search=${searchTerm}`),
                axios.get('/api/inventario/categorias'),
                axios.get('/api/inventario/marcas'),
                axios.get('/api/inventario/unidades')
            ]);
            setProductos(prodRes.data); // Axios wraps response in data, Laravel pagination wraps in data too.
            // Wait, Laravel paginate returns { data: [...], links: [...], ... } directly in prodRes.data

            setCategorias(catRes.data);
            setMarcas(marRes.data);
            setUnidades(uniRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (producto = null) => {
        if (producto) {
            setEditingProducto(producto);
            setFormData({
                codigo_sku: producto.codigo_sku,
                nombre: producto.nombre,
                descripcion_corta: producto.descripcion_corta || '',
                categoria_id: producto.categoria_id || '',
                marca_id: producto.marca_id || '',
                precio_venta_base: producto.precio_venta_base,
                costo_promedio: producto.costo_promedio || '',
                stock_minimo: producto.stock_minimo || '5',
                stock_maximo: producto.stock_maximo || '100',
                unidad_id: producto.unidad_id || '',
                controla_stock: producto.controla_stock !== undefined ? producto.controla_stock : true,
                usa_lotes: producto.usa_lotes !== undefined ? producto.usa_lotes : false,
                activo: producto.activo
            });
        } else {
            setEditingProducto(null);
            setFormData({
                codigo_sku: '',
                nombre: '',
                descripcion_corta: '',
                categoria_id: '',
                marca_id: '',
                precio_venta_base: '',
                costo_promedio: '',
                stock_minimo: '5',
                stock_maximo: '100',
                unidad_id: '',
                controla_stock: true,
                usa_lotes: false,
                activo: true
            });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (editingProducto) {
                await axios.put(`/api/inventario/productos/${editingProducto.id}`, formData);
                toast.success('Producto actualizado');
            } else {
                await axios.post('/api/inventario/productos', formData);
                toast.success('Producto creado');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar producto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Dar de baja este producto? Se marcará como inactivo y no se podrá vender.')) return;

        try {
            await axios.delete(`/api/inventario/productos/${id}`);
            toast.success('Producto dado de baja');
            fetchData();
        } catch (error) {
            toast.error('Error al dar de baja');
        }
    };

    // Removed client-side filtering functionality
    const productList = productos.data || [];

    // Memoize the name generator to ensure stability
    const getFullCategoryName = React.useCallback((catId) => {
        const cat = categorias.find(c => c.id === catId);
        if (!cat) return '';

        let name = cat.nombre;
        let parentId = cat.categoria_padre_id;

        // Limiter to prevent infinite loops in bad data
        let depth = 0;
        while (parentId && depth < 10) {
            const parent = categorias.find(c => c.id === parentId);
            if (parent) {
                name = `${parent.nombre} > ${name}`;
                parentId = parent.categoria_padre_id;
                depth++;
            } else {
                break;
            }
        }
        return name;
    }, [categorias]);

    // Optimize sorting with useMemo so it only recalculates when categories change
    const sortedCategories = React.useMemo(() => {
        return [...categorias].sort((a, b) => {
            const nameA = getFullCategoryName(a.id);
            const nameB = getFullCategoryName(b.id);
            return nameA.localeCompare(nameB);
        });
    }, [categorias, getFullCategoryName]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Productos - Inventario" />

            <PageHeader
                title="Gestión de Productos"
                breadcrumbs={[
                    { label: 'Inventario', href: route('inventario.productos') },
                    { label: 'Productos' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Producto
                    </Button>
                }
            />

            <Card>
                <div className="flex items-center justify-between mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="max-w-md"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <Squares2X2Icon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <ListBulletIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : productList.length === 0 ? (
                    <EmptyState
                        icon={CubeIcon}
                        title="No hay productos"
                        description={searchTerm ? 'No se encontraron productos' : 'Comienza agregando tu primer producto'}
                        action={
                            !searchTerm && (
                                <Button onClick={() => handleOpenModal()}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Agregar Producto
                                </Button>
                            )
                        }
                    />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {productList.map((producto) => (
                            <Card key={producto.id} padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                                    {producto.imagen_principal_url ? (
                                        <img
                                            src={producto.imagen_principal_url}
                                            alt={producto.nombre}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <PhotoIcon className="h-16 w-16 text-slate-300" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                                                {producto.nombre}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">SKU: {producto.codigo_sku}</p>
                                        </div>
                                        <Badge variant={producto.activo ? 'success' : 'danger'} size="sm">
                                            {producto.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-lg font-bold text-primary-600">
                                            {formatCurrency(producto.precio_venta_base)}
                                        </p>
                                        <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                            Stock: {producto.stock_total || 0}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                        <span>{producto.categoria?.nombre || 'Sin categoría'}</span>
                                        <span>{producto.marca?.nombre || 'Sin marca'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleOpenModal(producto)}
                                            className="flex-1"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleDelete(producto.id)}
                                            className="flex-1"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Categoría / Marca</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Precio</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {productList.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {producto.codigo_sku}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{producto.nombre}</div>
                                            <div className="text-xs text-slate-500">{producto.descripcion_corta}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{producto.categoria?.nombre || '-'}</div>
                                            <div className="text-xs text-slate-500">{producto.marca?.nombre || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                                            {formatCurrency(producto.precio_venta_base)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                            {producto.stock_total || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={producto.activo ? 'success' : 'danger'}>
                                                {producto.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleOpenModal(producto)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(producto.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingProducto ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Código SKU"
                            required
                            value={formData.codigo_sku}
                            onChange={(e) => setFormData({ ...formData, codigo_sku: e.target.value })}
                            error={errors.codigo_sku?.[0]}
                        />
                        <Input
                            label="Nombre del Producto"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            error={errors.nombre?.[0]}
                        />
                    </div>

                    <Input
                        label="Descripción Corta"
                        value={formData.descripcion_corta}
                        onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
                        error={errors.descripcion_corta?.[0]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
                            <select
                                value={formData.categoria_id}
                                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Sin categoría</option>
                                {sortedCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {getFullCategoryName(cat.id)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Marca</label>
                            <select
                                value={formData.marca_id}
                                onChange={(e) => setFormData({ ...formData, marca_id: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Sin marca</option>
                                {marcas.map(marca => (
                                    <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Unidad de Medida</label>
                        <select
                            value={formData.unidad_id}
                            onChange={(e) => setFormData({ ...formData, unidad_id: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        >
                            <option value="">Seleccionar Unidad</option>
                            {unidades.map(u => (
                                <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
                            ))}
                        </select>
                        {errors.unidad_id && <p className="text-red-500 text-xs mt-1">{errors.unidad_id[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Precio de Venta"
                            type="number"
                            step="0.01"
                            required
                            value={formData.precio_venta_base}
                            onChange={(e) => setFormData({ ...formData, precio_venta_base: e.target.value })}
                            error={errors.precio_venta_base?.[0]}
                        />
                        <Input
                            label="Costo Promedio"
                            type="number"
                            step="0.01"
                            value={formData.costo_promedio}
                            onChange={(e) => setFormData({ ...formData, costo_promedio: e.target.value })}
                            error={errors.costo_promedio?.[0]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Stock Mínimo"
                            type="number"
                            value={formData.stock_minimo}
                            onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                        />
                        <Input
                            label="Stock Máximo"
                            type="number"
                            value={formData.stock_maximo}
                            onChange={(e) => setFormData({ ...formData, stock_maximo: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="controla_stock"
                                checked={formData.controla_stock}
                                onChange={(e) => setFormData({ ...formData, controla_stock: e.target.checked })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="controla_stock" className="text-sm font-medium text-slate-700">
                                Controla Stock
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="usa_lotes"
                                checked={formData.usa_lotes}
                                onChange={(e) => setFormData({ ...formData, usa_lotes: e.target.checked })}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="usa_lotes" className="text-sm font-medium text-slate-700">
                                Requiere Lotes
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="activo"
                            checked={formData.activo}
                            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                            Producto Activo
                        </label>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout >
    );
}
