import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMarca, setEditingMarca] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', pais: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/inventario/marcas');
            setMarcas(response.data);
        } catch (error) {
            toast.error('Error al cargar marcas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (marca = null) => {
        if (marca) {
            setEditingMarca(marca);
            setFormData({ nombre: marca.nombre, pais: marca.pais || '' });
        } else {
            setEditingMarca(null);
            setFormData({ nombre: '', pais: '' });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editingMarca) {
                await axios.put(`/api/inventario/marcas/${editingMarca.id}`, formData);
                toast.success('Marca actualizada');
            } else {
                await axios.post('/api/inventario/marcas', formData);
                toast.success('Marca creada');
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
        if (!confirm('¿Eliminar esta marca?')) return;
        try {
            await axios.delete(`/api/inventario/marcas/${id}`);
            toast.success('Marca eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredMarcas = marcas.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Marcas - Inventario" />
            <PageHeader
                title="Marcas de Productos"
                breadcrumbs={[
                    { label: 'Inventario', href: route('inventario.productos') },
                    { label: 'Marcas' }
                ]}
                actions={<Button onClick={() => handleOpenModal()}><PlusIcon className="h-5 w-5 mr-2" />Nueva Marca</Button>}
            />
            <Card>
                <div className="mb-6">
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar marca..." className="max-w-md" />
                </div>
                {loading ? <LoadingSpinner className="py-12" /> : filteredMarcas.length === 0 ? (
                    <EmptyState icon={TagIcon} title="No hay marcas" description="Comienza agregando marcas de productos"
                        action={<Button onClick={() => handleOpenModal()}><PlusIcon className="h-5 w-5 mr-2" />Crear Marca</Button>} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMarcas.map((marca) => (
                            <Card key={marca.id} padding="default" className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">{marca.nombre}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{marca.pais || 'Sin país'}</p>
                                        <p className="text-xs text-slate-400 mt-2">{marca.productos_count || 0} producto(s)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(marca)} className="text-primary-600 hover:text-primary-900">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(marca.id)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingMarca ? 'Editar Marca' : 'Nueva Marca'}
                footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} loading={saving}>{editingMarca ? 'Guardar' : 'Crear'}</Button></>}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nombre de la Marca" required value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} error={errors.nombre?.[0]} />
                    <Input label="País de Origen" value={formData.pais}
                        onChange={(e) => setFormData({ ...formData, pais: e.target.value })} error={errors.pais?.[0]} />
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
