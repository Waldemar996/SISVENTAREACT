import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        razon_social: '',
        nombre_comercial: '',
        nit: '',
        direccion: '',
        telefono: '',
        email: '',
        limite_credito: '0',
        dias_credito: '0',
        tipo_contribuyente: 'general_iva'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/comercial/clientes');
            setClientes(response.data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cliente = null) => {
        if (cliente) {
            setEditingCliente(cliente);
            setFormData({
                razon_social: cliente.razon_social,
                nombre_comercial: cliente.nombre_comercial || '',
                nit: cliente.nit || '',
                direccion: cliente.direccion || '',
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                limite_credito: cliente.limite_credito || '0',
                dias_credito: cliente.dias_credito || '0',
                tipo_contribuyente: cliente.tipo_contribuyente || 'general_iva'
            });
        } else {
            setEditingCliente(null);
            setFormData({
                razon_social: '',
                nombre_comercial: '',
                nit: '',
                direccion: '',
                telefono: '',
                email: '',
                limite_credito: '0',
                dias_credito: '0',
                tipo_contribuyente: 'general_iva'
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
            if (editingCliente) {
                await axios.put(`/api/comercial/clientes/${editingCliente.id}`, formData);
                toast.success('Cliente actualizado correctamente');
            } else {
                await axios.post('/api/comercial/clientes', formData);
                toast.success('Cliente registrado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar cliente');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Dar de baja este cliente? Se marcará como inactivo.')) return;

        try {
            await axios.delete(`/api/comercial/clientes/${id}`);
            toast.success('Cliente dado de baja correctamente');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al dar de baja cliente');
        }
    };

    const filteredClientes = clientes.filter(cliente => {
        const matchesSearch = cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cliente.nit && cliente.nit.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterTipo === 'all' || cliente.tipo_contribuyente === filterTipo;
        return matchesSearch && matchesFilter;
    });

    const getTipoContribuyenteBadge = (tipo) => {
        const variants = {
            pequeno_contribuyente: { variant: 'info', label: 'Pequeño' },
            general_iva: { variant: 'primary', label: 'General IVA' },
            exento: { variant: 'success', label: 'Exento' }
        };
        const config = variants[tipo] || variants.general_iva;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Clientes - Comercial" />

            <PageHeader
                title="Gestión de Clientes"
                breadcrumbs={[
                    { label: 'Comercial', href: route('comercial.clientes') },
                    { label: 'Clientes' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()} variant="primary">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Cliente
                    </Button>
                }
            />

            <Card>
                <div className="flex items-center justify-between mb-6 gap-4">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por razón social o NIT..."
                        className="max-w-md"
                    />
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="pequeno_contribuyente">Pequeño Contribuyente</option>
                        <option value="general_iva">General IVA</option>
                        <option value="exento">Exento</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredClientes.length === 0 ? (
                    <EmptyState
                        icon={UserGroupIcon}
                        title="No hay clientes"
                        description={searchTerm ? 'No se encontraron clientes con ese criterio' : 'Comienza agregando tu primer cliente'}
                        action={
                            !searchTerm && (
                                <Button onClick={() => handleOpenModal()}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Agregar Cliente
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">NIT</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Razón Social</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Crédito</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredClientes.map((cliente) => (
                                    <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {cliente.nit || 'C/F'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{cliente.razon_social}</div>
                                            {cliente.nombre_comercial && (
                                                <div className="text-xs text-slate-500">{cliente.nombre_comercial}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {cliente.telefono && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-600">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {cliente.telefono}
                                                    </div>
                                                )}
                                                {cliente.email && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-600">
                                                        <EnvelopeIcon className="h-3 w-3" />
                                                        {cliente.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTipoContribuyenteBadge(cliente.tipo_contribuyente)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{formatCurrency(cliente.limite_credito)}</div>
                                            <div className="text-xs text-slate-500">{cliente.dias_credito} días</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(cliente)}
                                                className="text-primary-600 hover:text-primary-900 mr-4 transition-colors"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cliente.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
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

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Razón Social"
                            required
                            value={formData.razon_social}
                            onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                            error={errors.razon_social?.[0]}
                        />
                        <Input
                            label="Nombre Comercial"
                            value={formData.nombre_comercial}
                            onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                            error={errors.nombre_comercial?.[0]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="NIT"
                            value={formData.nit}
                            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                            error={errors.nit?.[0]}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Tipo de Contribuyente <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.tipo_contribuyente}
                                onChange={(e) => setFormData({ ...formData, tipo_contribuyente: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="pequeno_contribuyente">Pequeño Contribuyente</option>
                                <option value="general_iva">General IVA</option>
                                <option value="exento">Exento</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Dirección"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        error={errors.direccion?.[0]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            error={errors.telefono?.[0]}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email?.[0]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Límite de Crédito"
                            type="number"
                            step="0.01"
                            value={formData.limite_credito}
                            onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                            error={errors.limite_credito?.[0]}
                        />
                        <Input
                            label="Días de Crédito"
                            type="number"
                            value={formData.dias_credito}
                            onChange={(e) => setFormData({ ...formData, dias_credito: e.target.value })}
                            error={errors.dias_credito?.[0]}
                        />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
