import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState(null);
    const [saving, setSaving] = useState(false);

    // Removed expandedCategories state as we are switching to table

    const [formData, setFormData] = useState({
        nombre: '',
        categoria_padre_id: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/inventario/categorias');
            setCategorias(response.data);
        } catch (error) {
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (categoria = null) => {
        if (categoria) {
            setEditingCategoria(categoria);
            setFormData({
                nombre: categoria.nombre,
                categoria_padre_id: categoria.categoria_padre_id || ''
            });
        } else {
            setEditingCategoria(null);
            setFormData({ nombre: '', categoria_padre_id: '' });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (editingCategoria) {
                await axios.put(`/api/inventario/categorias/${editingCategoria.id}`, formData);
                toast.success('Categoría actualizada');
            } else {
                await axios.post('/api/inventario/categorias', formData);
                toast.success('Categoría creada');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Inactivar esta categoría?')) return;
        try {
            await axios.delete(`/api/inventario/categorias/${id}`);
            toast.success('Categoría eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Recursive function to flatten the tree for the table, but keeping the order
    // Memoized to avoid re-creation on every render
    const buildFlatTree = React.useCallback((categories, parentId = null, level = 0, visited = new Set()) => {
        let result = [];
        // Filter direct children
        const children = categories.filter(cat => {
            if (parentId === null) {
                return cat.categoria_padre_id == null || cat.categoria_padre_id === 0;
            }
            return cat.categoria_padre_id === parentId;
        });

        children.forEach(child => {
            // Prevent infinite loops / cycles
            if (visited.has(child.id)) return;
            visited.add(child.id);

            result.push({ ...child, level });

            // Recursively get grandchildren
            const grandchildren = buildFlatTree(categories, child.id, level + 1, visited);
            result = [...result, ...grandchildren];
        });

        return result;
    }, []);

    // Main Logic - Memoized to prevent recalculation unless data changes
    const displayData = React.useMemo(() => {
        if (searchTerm) {
            return categorias.filter(cat =>
                cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(cat => ({ ...cat, level: 0 }));
        }

        const treeData = buildFlatTree(categorias);
        const touchedIds = treeData.map(item => item.id);

        const orphans = categorias.filter(cat => !touchedIds.includes(cat.id))
            .map(cat => ({ ...cat, level: 0, isOrphan: true }));

        return [...treeData, ...orphans];
    }, [categorias, searchTerm, buildFlatTree]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Categorías - Inventario" />

            <PageHeader
                title="Categorías de Productos"
                breadcrumbs={[
                    { label: 'Inventario', href: route('inventario.productos') },
                    { label: 'Categorías' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Categoría
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar categoría..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : categorias.length === 0 ? (
                    <EmptyState
                        icon={FolderIcon}
                        title="No hay categorías"
                        description="Organiza tus productos creando categorías"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Categoría
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Jerarquía (Padre)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Productos</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {displayData.map((cat) => {
                                    const parentName = categorias.find(p => p.id === cat.categoria_padre_id)?.nombre || '-';
                                    return (
                                        <tr key={cat.id} className={`hover:bg-slate-50 ${cat.isOrphan ? 'bg-red-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div
                                                    className="flex items-center gap-2"
                                                    style={{ paddingLeft: `${cat.level * 24}px` }}
                                                >
                                                    {cat.level > 0 && (
                                                        <div className="w-4 border-l-2 border-b-2 border-slate-300 h-4 -mt-2 mr-1 rounded-bl-sm"></div>
                                                    )}
                                                    <FolderIcon className={`h-5 w-5 ${cat.isOrphan ? 'text-red-400' : 'text-primary-500'}`} />
                                                    <span className="text-sm font-medium text-slate-900">
                                                        {cat.nombre}
                                                        {cat.isOrphan && <span className="text-xs text-red-500 ml-2 italic">(Sin Jerarquía Valida)</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {parentName !== '-' ? parentName : <span className="text-slate-400 italic">Raíz</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {cat.productos_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleOpenModal(cat)}
                                                    className="text-primary-600 hover:text-primary-900 mr-4"
                                                >
                                                    <PencilIcon className="h-5 w-5 inline" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingCategoria ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre de la Categoría"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        error={errors.nombre?.[0]}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría Padre (Opcional)</label>
                        <select
                            value={formData.categoria_padre_id}
                            onChange={(e) => setFormData({ ...formData, categoria_padre_id: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">Sin categoría padre (Raíz)</option>
                            {categorias
                                .filter(cat => !editingCategoria || cat.id !== editingCategoria.id)
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                        </select>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
