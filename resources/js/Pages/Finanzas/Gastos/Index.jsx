import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
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
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGasto, setEditingGasto] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        categoria_id: '',
        descripcion: '',
        monto: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        numero_documento: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [gastosRes, catRes] = await Promise.all([
                axios.get('/api/finanzas/gastos'),
                axios.get('/api/finanzas/categorias-gastos')
            ]);
            setGastos(gastosRes.data.data || gastosRes.data);
            setCategorias(catRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (gasto = null) => {
        if (gasto) {
            setEditingGasto(gasto);
            setFormData({
                categoria_id: gasto.categoria_id || '',
                descripcion: gasto.descripcion,
                monto: gasto.monto,
                fecha_gasto: gasto.fecha_gasto,
                metodo_pago: gasto.metodo_pago || 'efectivo',
                numero_documento: gasto.numero_documento || ''
            });
        } else {
            setEditingGasto(null);
            setFormData({
                categoria_id: '',
                descripcion: '',
                monto: '',
                fecha_gasto: new Date().toISOString().split('T')[0],
                metodo_pago: 'efectivo',
                numero_documento: ''
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
            if (editingGasto) {
                await axios.put(`/api/finanzas/gastos/${editingGasto.id}`, formData);
                toast.success('Gasto actualizado');
            } else {
                await axios.post('/api/finanzas/gastos', formData);
                toast.success('Gasto registrado');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar gasto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        try {
            await axios.delete(`/api/finanzas/gastos/${id}`);
            toast.success('Gasto eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredGastos = gastos.filter(g =>
        g.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const getMetodoPagoBadge = (metodo) => {
        if (!metodo) return <Badge variant="secondary">N/A</Badge>;
        const variants = {
            efectivo: 'success',
            transferencia: 'primary',
            cheque: 'info',
            tarjeta: 'warning'
        };
        return <Badge variant={variants[metodo] || 'secondary'}>{metodo.toUpperCase()}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Gastos - Finanzas" />

            <PageHeader
                title="Gestión de Gastos"
                breadcrumbs={[
                    { label: 'Finanzas', href: route('finanzas.gastos') },
                    { label: 'Gastos' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Registrar Gasto
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar gasto..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredGastos.length === 0 ? (
                    <EmptyState
                        icon={BanknotesIcon}
                        title="No hay gastos registrados"
                        description="Comienza registrando tu primer gasto"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Registrar Gasto
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Categoría</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Método Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Monto</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredGastos.map((gasto) => (
                                    <tr key={gasto.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {gasto.fecha_gasto}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{gasto.descripcion}</div>
                                            {gasto.numero_documento && (
                                                <div className="text-xs text-slate-500">Doc: {gasto.numero_documento}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {gasto.categoria?.nombre || 'Sin categoría'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getMetodoPagoBadge(gasto.metodo_pago)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                            {formatCurrency(gasto.monto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleOpenModal(gasto)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(gasto.id)}
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
                title={editingGasto ? 'Editar Gasto' : 'Registrar Gasto'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingGasto ? 'Guardar' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
                            <select
                                value={formData.categoria_id}
                                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Sin categoría</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Fecha del Gasto"
                            type="date"
                            required
                            value={formData.fecha_gasto}
                            onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                            error={errors.fecha_gasto?.[0]}
                        />
                    </div>

                    <Input
                        label="Descripción"
                        required
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        error={errors.descripcion?.[0]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Monto"
                            type="number"
                            step="0.01"
                            required
                            value={formData.monto}
                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                            error={errors.monto?.[0]}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Método de Pago</label>
                            <select
                                value={formData.metodo_pago}
                                onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="tarjeta">Tarjeta</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Número de Documento"
                        value={formData.numero_documento}
                        onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                        error={errors.numero_documento?.[0]}
                    />
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
