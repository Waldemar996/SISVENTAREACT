import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
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
    const [ordenes, setOrdenes] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        formula_id: '',
        cantidad_a_producir: 1,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin_estimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        observaciones: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [ordRes, formRes] = await Promise.all([
                axios.get('/api/produccion/ordenes'),
                axios.get('/api/produccion/formulas')
            ]);
            setOrdenes(ordRes.data);
            setFormulas(formRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            formula_id: '',
            cantidad_a_producir: 1,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin_estimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observaciones: ''
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await axios.post('/api/produccion/ordenes', formData);
            toast.success('Orden de producción creada');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al crear orden');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeEstado = async (id, nuevoEstado) => {
        try {
            await axios.patch(`/api/produccion/ordenes/${id}/estado`, { estado: nuevoEstado });
            toast.success('Estado actualizado');
            fetchData();
        } catch (error) {
            toast.error('Error al actualizar estado');
        }
    };

    const filteredOrdenes = ordenes.filter(ord =>
        ord.numero_orden?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEstadoBadge = (estado) => {
        const variants = {
            planificada: 'default',
            en_proceso: 'warning',
            completada: 'success',
            cancelada: 'danger'
        };
        return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Órdenes - Producción" />

            <PageHeader
                title="Órdenes de Producción"
                breadcrumbs={[
                    { label: 'Producción', href: route('produccion.formulas') },
                    { label: 'Órdenes' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Orden
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar orden..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredOrdenes.length === 0 ? (
                    <EmptyState
                        icon={ClipboardDocumentListIcon}
                        title="No hay órdenes"
                        description="Crea órdenes de producción basadas en tus fórmulas"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Orden
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fechas</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredOrdenes.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {orden.numero_orden}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {orden.formula?.producto?.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {orden.cantidad_a_producir}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div>{orden.fecha_inicio}</div>
                                            <div className="text-xs">Est: {orden.fecha_fin_estimada}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(orden.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {orden.estado === 'planificada' && (
                                                <button
                                                    onClick={() => handleChangeEstado(orden.id, 'en_proceso')}
                                                    className="text-amber-600 hover:text-amber-900 mr-3"
                                                    title="Iniciar Producción"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5 inline" />
                                                </button>
                                            )}
                                            {orden.estado === 'en_proceso' && (
                                                <button
                                                    onClick={() => handleChangeEstado(orden.id, 'completada')}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    title="Completar"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5 inline" />
                                                </button>
                                            )}
                                            {(orden.estado === 'planificada' || orden.estado === 'en_proceso') && (
                                                <button
                                                    onClick={() => handleChangeEstado(orden.id, 'cancelada')}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Cancelar"
                                                >
                                                    <XCircleIcon className="h-5 w-5 inline" />
                                                </button>
                                            )}
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
                title="Nueva Orden de Producción"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Crear Orden</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Fórmula <span className="text-red-500">*</span></label>
                        <select required value={formData.formula_id}
                            onChange={(e) => setFormData({ ...formData, formula_id: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                            <option value="">Seleccione Fórmula</option>
                            {formulas.map(form => (
                                <option key={form.id} value={form.id}>
                                    {form.producto?.nombre} (Produce: {form.cantidad_producir})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input label="Cantidad a Producir" type="number" min="1" required value={formData.cantidad_a_producir}
                        onChange={(e) => setFormData({ ...formData, cantidad_a_producir: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Fecha Inicio" type="date" required value={formData.fecha_inicio}
                            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} />
                        <Input label="Fecha Fin Estimada" type="date" required value={formData.fecha_fin_estimada}
                            onChange={(e) => setFormData({ ...formData, fecha_fin_estimada: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones</label>
                        <textarea value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3} className="block w-full rounded-lg border-slate-300" />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
