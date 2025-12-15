import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, ReceiptPercentIcon
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
    const [impuestos, setImpuestos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingImpuesto, setEditingImpuesto] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        porcentaje: 0,
        tipo: 'iva',
        activo: true,
        descripcion: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/configuracion/impuestos');
            setImpuestos(response.data);
        } catch (error) {
            toast.error('Error al cargar impuestos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (impuesto = null) => {
        if (impuesto) {
            setEditingImpuesto(impuesto);
            setFormData({
                nombre: impuesto.nombre,
                codigo: impuesto.codigo,
                porcentaje: impuesto.porcentaje,
                tipo: impuesto.tipo,
                activo: impuesto.activo,
                descripcion: impuesto.descripcion || ''
            });
        } else {
            setEditingImpuesto(null);
            setFormData({
                nombre: '',
                codigo: '',
                porcentaje: 0,
                tipo: 'iva',
                activo: true,
                descripcion: ''
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
            if (editingImpuesto) {
                await axios.put(`/api/configuracion/impuestos/${editingImpuesto.id}`, formData);
                toast.success('Impuesto actualizado correctamente');
            } else {
                await axios.post('/api/configuracion/impuestos', formData);
                toast.success('Impuesto creado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar impuesto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este impuesto?')) return;

        try {
            await axios.delete(`/api/configuracion/impuestos/${id}`);
            toast.success('Impuesto eliminado correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar impuesto');
        }
    };

    const filteredImpuestos = impuestos.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Configuración de Impuestos" />

            <PageHeader
                title="Configuración de Impuestos"
                breadcrumbs={[
                    { label: 'Configuración', href: route('dashboard') },
                    { label: 'Impuestos' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Impuesto
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar impuesto..."
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredImpuestos.length === 0 ? (
                    <EmptyState
                        icon={ReceiptPercentIcon}
                        title="No hay impuestos configurados"
                        description="Comienza agregando los impuestos que aplican a tu empresa"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Impuesto
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Porcentaje</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredImpuestos.map((impuesto) => (
                                    <tr key={impuesto.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                            {impuesto.codigo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {impuesto.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {impuesto.tipo.toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                                            {impuesto.porcentaje}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={impuesto.activo ? 'success' : 'danger'}>
                                                {impuesto.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleOpenModal(impuesto)}
                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                                title="Editar"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(impuesto.id)}
                                                className="text-danger-600 hover:text-danger-900"
                                                title="Eliminar"
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

            {/* Modal Crear/Editar Impuesto */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingImpuesto ? 'Editar Impuesto' : 'Nuevo Impuesto'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingImpuesto ? 'Guardar Cambios' : 'Crear Impuesto'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Código"
                            required
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            error={errors.codigo?.[0]}
                            placeholder="IVA"
                        />
                        <Input
                            label="Nombre"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            error={errors.nombre?.[0]}
                            placeholder="Impuesto al Valor Agregado"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Tipo de Impuesto
                            </label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="iva">IVA</option>
                                <option value="isr">ISR</option>
                                <option value="timbre">Timbre</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        <Input
                            label="Porcentaje"
                            type="number"
                            step="0.01"
                            required
                            value={formData.porcentaje}
                            onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                            error={errors.porcentaje?.[0]}
                            placeholder="12.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                            placeholder="Descripción del impuesto..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="activo"
                            checked={formData.activo}
                            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <label htmlFor="activo" className="ml-2 text-sm font-medium text-secondary-700">
                            Impuesto Activo
                        </label>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
