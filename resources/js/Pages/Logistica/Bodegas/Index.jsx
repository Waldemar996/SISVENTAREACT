import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BuildingStorefrontIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
    const [bodegas, setBodegas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBodega, setEditingBodega] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        codigo_sucursal: '',
        direccion: '',
        telefono: '',
        tipo: 'bodega_central',
        activa: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/logistica/bodegas');
            setBodegas(response.data);
        } catch (error) {
            toast.error('Error al cargar bodegas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (bodega = null) => {
        if (bodega) {
            setEditingBodega(bodega);
            setFormData({
                nombre: bodega.nombre,
                codigo_sucursal: bodega.codigo_sucursal || '',
                direccion: bodega.direccion || '',
                telefono: bodega.telefono || '',
                tipo: bodega.tipo || 'bodega_central',
                activa: bodega.activa
            });
        } else {
            setEditingBodega(null);
            setFormData({
                nombre: '',
                codigo_sucursal: '',
                direccion: '',
                telefono: '',
                tipo: 'bodega_central',
                activa: true
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
            if (editingBodega) {
                await axios.put(`/api/logistica/bodegas/${editingBodega.id}`, formData);
                toast.success('Bodega actualizada');
            } else {
                await axios.post('/api/logistica/bodegas', formData);
                toast.success('Bodega creada');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar bodega');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Inactivar esta bodega?')) return;
        try {
            await axios.delete(`/api/logistica/bodegas/${id}`);
            toast.success('Bodega eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredBodegas = bodegas.filter(b =>
        b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.codigo_sucursal && b.codigo_sucursal.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getTipoBadge = (tipo) => {
        const variants = {
            bodega_central: 'primary',
            tienda: 'info',
            produccion: 'warning',
            virtual: 'default'
        };
        // Normalize label from snake_case to Title Case
        const label = tipo.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return <Badge variant={variants[tipo] || 'default'}>{label}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Bodegas - Logística" />

            <PageHeader
                title="Gestión de Bodegas"
                breadcrumbs={[
                    { label: 'Logística', href: route('logistica.bodegas') },
                    { label: 'Bodegas' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Bodega
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar bodega..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredBodegas.length === 0 ? (
                    <EmptyState
                        icon={BuildingStorefrontIcon}
                        title="No hay bodegas"
                        description="Crea bodegas para gestionar tu inventario"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Bodega
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBodegas.map((bodega) => (
                            <Card key={bodega.id} padding="default" className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">{bodega.nombre}</h3>
                                        {bodega.codigo_sucursal && (
                                            <p className="text-sm text-slate-500 mt-1">Código: {bodega.codigo_sucursal}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        {getTipoBadge(bodega.tipo)}
                                        <Badge variant={bodega.activa ? 'success' : 'danger'} size="sm">
                                            {bodega.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-3 mt-3">
                                    {bodega.direccion && (
                                        <p className="text-xs text-slate-600 mb-2">📍 {bodega.direccion}</p>
                                    )}
                                    {bodega.telefono && (
                                        <p className="text-xs text-slate-600 mb-2">📞 {bodega.telefono}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs text-slate-500">Productos:</span>
                                        <span className="text-sm font-semibold text-primary-600">
                                            {bodega.productos_count || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleOpenModal(bodega)}
                                        className="flex-1"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(bodega.id)}
                                        className="flex-1"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingBodega ? 'Editar Bodega' : 'Nueva Bodega'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingBodega ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre de la Bodega" required value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} error={errors.nombre?.[0]} />
                        <Input label="Código Sucursal" value={formData.codigo_sucursal}
                            onChange={(e) => setFormData({ ...formData, codigo_sucursal: e.target.value })} error={errors.codigo_sucursal?.[0]} />
                    </div>

                    <Input label="Dirección" value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} error={errors.direccion?.[0]} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Teléfono" value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} error={errors.telefono?.[0]} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Bodega</label>
                            <select value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                                <option value="bodega_central">Bodega Central</option>
                                <option value="tienda">Tienda</option>
                                <option value="produccion">Producción</option>
                                <option value="virtual">Virtual</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="activa" checked={formData.activa}
                            onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="activa" className="text-sm font-medium text-slate-700">
                            Bodega Activa
                        </label>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
