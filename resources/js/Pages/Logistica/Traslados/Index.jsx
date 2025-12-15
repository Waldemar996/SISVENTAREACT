import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, EyeIcon, ArrowsRightLeftIcon, CheckCircleIcon,
    XCircleIcon, ClockIcon
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
    const [traslados, setTraslados] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTraslado, setSelectedTraslado] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        bodega_origen_id: '',
        bodega_destino_id: '',
        fecha_traslado: new Date().toISOString().split('T')[0],
        observaciones: '',
        detalles: [{ producto_id: '', cantidad: 1 }]
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [trasladosRes, bodegasRes, productosRes] = await Promise.all([
                axios.get('/api/logistica/traslados'),
                axios.get('/api/logistica/bodegas'),
                axios.get('/api/inventario/productos')
            ]);
            setTraslados(trasladosRes.data.data || trasladosRes.data || []);
            setBodegas(bodegasRes.data);
            setProductos(productosRes.data.data || productosRes.data || []);
        } catch (error) {
            toast.error('Error al cargar traslados');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            bodega_origen_id: '',
            bodega_destino_id: '',
            fecha_traslado: new Date().toISOString().split('T')[0],
            observaciones: '',
            detalles: [{ producto_id: '', cantidad: 1 }]
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.bodega_origen_id === formData.bodega_destino_id) {
            toast.error('La bodega origen y destino deben ser diferentes');
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            await axios.post('/api/logistica/traslados', formData);
            toast.success('Traslado registrado correctamente');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al registrar traslado');
        } finally {
            setSaving(false);
        }
    };

    const handleAprobar = async (id) => {
        if (!confirm('¿Aprobar este traslado? Se actualizará el inventario.')) return;

        try {
            await axios.post(`/api/logistica/traslados/${id}/aprobar`);
            toast.success('Traslado aprobado correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al aprobar traslado');
        }
    };

    const handleRechazar = async (id) => {
        if (!confirm('¿Rechazar este traslado?')) return;

        try {
            await axios.post(`/api/logistica/traslados/${id}/rechazar`);
            toast.success('Traslado rechazado');
            fetchData();
        } catch (error) {
            toast.error('Error al rechazar traslado');
        }
    };

    const addDetalle = () => {
        setFormData({
            ...formData,
            detalles: [...formData.detalles, { producto_id: '', cantidad: 1 }]
        });
    };

    const removeDetalle = (index) => {
        setFormData({
            ...formData,
            detalles: formData.detalles.filter((_, i) => i !== index)
        });
    };

    const updateDetalle = (index, field, value) => {
        const newDetalles = [...formData.detalles];
        newDetalles[index][field] = value;
        setFormData({ ...formData, detalles: newDetalles });
    };

    const filteredTraslados = traslados.filter(t => {
        const matchesSearch = t.numero_traslado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.bodega_origen?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.bodega_destino?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado === 'all' || t.estado === filterEstado;
        return matchesSearch && matchesEstado;
    });

    const getEstadoBadge = (estado) => {
        const variants = {
            pendiente: 'warning',
            aprobado: 'success',
            rechazado: 'danger',
            en_transito: 'info'
        };
        return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Traslados entre Bodegas" />

            <PageHeader
                title="Traslados entre Bodegas"
                breadcrumbs={[
                    { label: 'Logística', href: route('dashboard') },
                    { label: 'Traslados' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Traslado
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar traslado..."
                        className="flex-1"
                    />
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="aprobado">Aprobados</option>
                        <option value="en_transito">En Tránsito</option>
                        <option value="rechazado">Rechazados</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredTraslados.length === 0 ? (
                    <EmptyState
                        icon={ArrowsRightLeftIcon}
                        title="No hay traslados"
                        description="Comienza registrando tu primer traslado entre bodegas"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Traslado
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Origen</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Destino</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Productos</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredTraslados.map((traslado) => (
                                    <tr key={traslado.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                            {traslado.numero_traslado}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {traslado.fecha_traslado}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {traslado.bodega_origen?.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {traslado.bodega_destino?.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {traslado.detalles?.length || 0} productos
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(traslado.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setSelectedTraslado(traslado);
                                                    setDetailModalOpen(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                                title="Ver Detalle"
                                            >
                                                <EyeIcon className="h-5 w-5 inline" />
                                            </button>
                                            {traslado.estado === 'pendiente' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAprobar(traslado.id)}
                                                        className="text-success-600 hover:text-success-900 mr-3"
                                                        title="Aprobar"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRechazar(traslado.id)}
                                                        className="text-danger-600 hover:text-danger-900"
                                                        title="Rechazar"
                                                    >
                                                        <XCircleIcon className="h-5 w-5 inline" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Nuevo Traslado */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nuevo Traslado entre Bodegas"
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Registrar Traslado</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Bodega Origen <span className="text-danger-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.bodega_origen_id}
                                onChange={(e) => setFormData({ ...formData, bodega_origen_id: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Seleccione Bodega</option>
                                {bodegas.map(bodega => (
                                    <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Bodega Destino <span className="text-danger-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.bodega_destino_id}
                                onChange={(e) => setFormData({ ...formData, bodega_destino_id: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Seleccione Bodega</option>
                                {bodegas.filter(b => b.id != formData.bodega_origen_id).map(bodega => (
                                    <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Fecha de Traslado"
                            type="date"
                            required
                            value={formData.fecha_traslado}
                            onChange={(e) => setFormData({ ...formData, fecha_traslado: e.target.value })}
                        />
                    </div>

                    <div className="border-t border-secondary-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-secondary-900">Productos a Trasladar</h3>
                            <Button type="button" size="sm" onClick={addDetalle}>
                                <PlusIcon className="h-4 w-4 mr-1" />Agregar Producto
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {formData.detalles.map((det, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end bg-secondary-50 p-3 rounded-lg">
                                    <div className="col-span-9">
                                        <select
                                            value={det.producto_id}
                                            onChange={(e) => updateDetalle(index, 'producto_id', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                        >
                                            <option value="">Seleccione Producto</option>
                                            {productos.map(prod => (
                                                <option key={prod.id} value={prod.id}>
                                                    {prod.nombre} - Stock: {prod.stock_actual}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={det.cantidad}
                                            onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                            placeholder="Cantidad"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            onClick={() => removeDetalle(index)}
                                        >
                                            <XCircleIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                            placeholder="Observaciones del traslado..."
                        />
                    </div>

                    <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                        <p className="text-sm text-info-800">
                            <strong>Nota:</strong> El traslado quedará pendiente de aprobación. Una vez aprobado, se actualizará automáticamente el inventario de ambas bodegas.
                        </p>
                    </div>
                </form>
            </Modal>

            {/* Modal Detalle */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Traslado ${selectedTraslado?.numero_traslado}`}
                size="xl"
            >
                {selectedTraslado && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-600">Bodega Origen</p>
                                <p className="font-semibold">{selectedTraslado.bodega_origen?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Bodega Destino</p>
                                <p className="font-semibold">{selectedTraslado.bodega_destino?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Fecha</p>
                                <p className="font-semibold">{selectedTraslado.fecha_traslado}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Estado</p>
                                {getEstadoBadge(selectedTraslado.estado)}
                            </div>
                        </div>
                        <div className="border-t border-secondary-200 pt-4">
                            <h4 className="font-semibold mb-2">Productos</h4>
                            <table className="min-w-full">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs">Producto</th>
                                        <th className="px-4 py-2 text-right text-xs">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTraslado.detalles?.map((det, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2">{det.producto?.nombre}</td>
                                            <td className="px-4 py-2 text-right font-semibold">{det.cantidad}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedTraslado.observaciones && (
                            <div className="border-t border-secondary-200 pt-4">
                                <p className="text-sm text-secondary-600">Observaciones</p>
                                <p className="text-secondary-900">{selectedTraslado.observaciones}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
