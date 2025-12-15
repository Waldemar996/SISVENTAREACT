import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
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
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        razon_social: '',
        nombre_comercial: '',
        nit: '',
        nombre_contacto: '',
        telefono: '',
        email: '',
        regimen_fiscal: 'general',
        dias_credito: '0'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/comercial/proveedores');
            setProveedores(response.data);
        } catch (error) {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (proveedor = null) => {
        if (proveedor) {
            setEditingProveedor(proveedor);
            setFormData({
                razon_social: proveedor.razon_social,
                nombre_comercial: proveedor.nombre_comercial || '',
                nit: proveedor.nit || '',
                nombre_contacto: proveedor.nombre_contacto || '',
                telefono: proveedor.telefono || '',
                email: proveedor.email || '',
                regimen_fiscal: proveedor.regimen_fiscal || 'general',
                dias_credito: proveedor.dias_credito || '0'
            });
        } else {
            setEditingProveedor(null);
            setFormData({
                razon_social: '',
                nombre_comercial: '',
                nit: '',
                nombre_contacto: '',
                telefono: '',
                email: '',
                regimen_fiscal: 'general',
                dias_credito: '0'
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
            if (editingProveedor) {
                await axios.put(`/api/comercial/proveedores/${editingProveedor.id}`, formData);
                toast.success('Proveedor actualizado');
            } else {
                await axios.post('/api/comercial/proveedores', formData);
                toast.success('Proveedor registrado');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar proveedor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Dar de baja este proveedor? Se marcará como inactivo.')) return;

        try {
            await axios.delete(`/api/comercial/proveedores/${id}`);
            toast.success('Proveedor eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredProveedores = proveedores.filter(prov =>
        prov.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prov.nit && prov.nit.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRegimenBadge = (regimen) => {
        const variants = {
            pequeno_contribuyente: { variant: 'info', label: 'Pequeño' },
            general: { variant: 'primary', label: 'General' },
            agente_retenedor: { variant: 'success', label: 'Agente Retenedor' }
        };
        const config = variants[regimen] || variants.general;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Proveedores - Comercial" />

            <PageHeader
                title="Gestión de Proveedores"
                breadcrumbs={[
                    { label: 'Comercial', href: route('comercial.clientes') },
                    { label: 'Proveedores' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Proveedor
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por razón social o NIT..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredProveedores.length === 0 ? (
                    <EmptyState
                        icon={BuildingOfficeIcon}
                        title="No hay proveedores"
                        description={searchTerm ? 'No se encontraron proveedores' : 'Comienza agregando tu primer proveedor'}
                        action={
                            !searchTerm && (
                                <Button onClick={() => handleOpenModal()}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Agregar Proveedor
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Régimen Fiscal</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Crédito</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredProveedores.map((proveedor) => (
                                    <tr key={proveedor.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {proveedor.nit || 'C/F'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{proveedor.razon_social}</div>
                                            {proveedor.nombre_comercial && (
                                                <div className="text-xs text-slate-500">{proveedor.nombre_comercial}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {proveedor.nombre_contacto && (
                                                    <div className="text-xs font-medium text-slate-700">{proveedor.nombre_contacto}</div>
                                                )}
                                                {proveedor.telefono && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-600">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {proveedor.telefono}
                                                    </div>
                                                )}
                                                {proveedor.email && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-600">
                                                        <EnvelopeIcon className="h-3 w-3" />
                                                        {proveedor.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRegimenBadge(proveedor.regimen_fiscal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {proveedor.dias_credito} días
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleOpenModal(proveedor)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(proveedor.id)}
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
                title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingProveedor ? 'Guardar' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Razón Social" required value={formData.razon_social}
                            onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} error={errors.razon_social?.[0]} />
                        <Input label="Nombre Comercial" value={formData.nombre_comercial}
                            onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })} error={errors.nombre_comercial?.[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="NIT" value={formData.nit}
                            onChange={(e) => setFormData({ ...formData, nit: e.target.value })} error={errors.nit?.[0]} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Régimen Fiscal</label>
                            <select value={formData.regimen_fiscal}
                                onChange={(e) => setFormData({ ...formData, regimen_fiscal: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                                <option value="pequeno_contribuyente">Pequeño Contribuyente</option>
                                <option value="general">General</option>
                                <option value="agente_retenedor">Agente Retenedor</option>
                            </select>
                        </div>
                    </div>

                    <Input label="Nombre de Contacto" value={formData.nombre_contacto}
                        onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })} error={errors.nombre_contacto?.[0]} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Teléfono" type="tel" value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} error={errors.telefono?.[0]} />
                        <Input label="Email" type="email" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email?.[0]} />
                    </div>

                    <Input label="Días de Crédito" type="number" value={formData.dias_credito}
                        onChange={(e) => setFormData({ ...formData, dias_credito: e.target.value })} error={errors.dias_credito?.[0]} />
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
