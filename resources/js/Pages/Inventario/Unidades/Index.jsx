import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ScaleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUnidad, setEditingUnidad] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', abreviatura: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/inventario/unidades');
            setUnidades(response.data);
        } catch (error) {
            toast.error('Error al cargar unidades');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (unidad = null) => {
        if (unidad) {
            setEditingUnidad(unidad);
            setFormData({ nombre: unidad.nombre, abreviatura: unidad.abreviatura });
        } else {
            setEditingUnidad(null);
            setFormData({ nombre: '', abreviatura: '' });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editingUnidad) {
                await axios.put(`/api/inventario/unidades/${editingUnidad.id}`, formData);
                toast.success('Unidad actualizada');
            } else {
                await axios.post('/api/inventario/unidades', formData);
                toast.success('Unidad creada');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) setErrors(error.response.data.errors);
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta unidad?')) return;
        try {
            await axios.delete(`/api/inventario/unidades/${id}`);
            toast.success('Unidad eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredUnidades = unidades.filter(u => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Unidades - Inventario" />
            <PageHeader title="Unidades de Medida"
                breadcrumbs={[{ label: 'Inventario', href: route('inventario.productos') }, { label: 'Unidades' }]}
                actions={<Button onClick={() => handleOpenModal()}><PlusIcon className="h-5 w-5 mr-2" />Nueva Unidad</Button>} />
            <Card>
                <div className="mb-6">
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar unidad..." className="max-w-md" />
                </div>
                {loading ? <LoadingSpinner className="py-12" /> : filteredUnidades.length === 0 ? (
                    <EmptyState icon={ScaleIcon} title="No hay unidades" description="Define unidades de medida para tus productos"
                        action={<Button onClick={() => handleOpenModal()}><PlusIcon className="h-5 w-5 mr-2" />Crear Unidad</Button>} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Abreviatura</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Productos</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredUnidades.map((unidad) => (
                                    <tr key={unidad.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{unidad.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unidad.abreviatura}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unidad.productos_count || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button onClick={() => handleOpenModal(unidad)} className="text-primary-600 hover:text-primary-900 mr-4">
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button onClick={() => handleDelete(unidad.id)} className="text-red-600 hover:text-red-900">
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
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
                footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} loading={saving}>{editingUnidad ? 'Guardar' : 'Crear'}</Button></>}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nombre de la Unidad" required value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} error={errors.nombre?.[0]} />
                    <Input label="Abreviatura" required value={formData.abreviatura}
                        onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })} error={errors.abreviatura?.[0]} />
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
