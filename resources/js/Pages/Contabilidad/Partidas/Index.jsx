import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, EyeIcon, TrashIcon, DocumentTextIcon,
    CheckCircleIcon, XCircleIcon
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
    const [partidas, setPartidas] = useState([]);
    const [cuentas, setCuentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPartida, setSelectedPartida] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        numero_partida: '',
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        observaciones: '',
        detalles: [
            { cuenta_id: '', debe: 0, haber: 0, descripcion: '' },
            { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }
        ]
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [partidasRes, cuentasRes] = await Promise.all([
                axios.get('/api/contabilidad/partidas'),
                axios.get('/api/contabilidad/cuentas')
            ]);
            setPartidas(partidasRes.data);
            setCuentas(cuentasRes.data.filter(c => c.acepta_movimiento));
        } catch (error) {
            toast.error('Error al cargar partidas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            numero_partida: '',
            fecha: new Date().toISOString().split('T')[0],
            concepto: '',
            observaciones: '',
            detalles: [
                { cuenta_id: '', debe: 0, haber: 0, descripcion: '' },
                { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }
            ]
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar partida doble
        const totalDebe = formData.detalles.reduce((sum, d) => sum + parseFloat(d.debe || 0), 0);
        const totalHaber = formData.detalles.reduce((sum, d) => sum + parseFloat(d.haber || 0), 0);

        if (Math.abs(totalDebe - totalHaber) > 0.01) {
            toast.error('La partida no está cuadrada. Debe = Haber');
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            await axios.post('/api/contabilidad/partidas', formData);
            toast.success('Partida registrada correctamente');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al registrar partida');
        } finally {
            setSaving(false);
        }
    };

    const handleAnular = async (id) => {
        if (!confirm('¿Está seguro de anular esta partida?')) return;

        try {
            await axios.post(`/api/contabilidad/partidas/${id}/anular`);
            toast.success('Partida anulada correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al anular partida');
        }
    };

    const addDetalle = () => {
        setFormData({
            ...formData,
            detalles: [...formData.detalles, { cuenta_id: '', debe: 0, haber: 0, descripcion: '' }]
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

    const calcularTotales = () => {
        const debe = formData.detalles.reduce((sum, d) => sum + parseFloat(d.debe || 0), 0);
        const haber = formData.detalles.reduce((sum, d) => sum + parseFloat(d.haber || 0), 0);
        return { debe, haber, diferencia: debe - haber };
    };

    const filteredPartidas = partidas.filter(p => {
        const matchesSearch = p.numero_partida?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.concepto?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado === 'all' || p.estado === filterEstado;
        return matchesSearch && matchesEstado;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const totales = calcularTotales();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Partidas Contables" />

            <PageHeader
                title="Partidas Contables (Asientos)"
                breadcrumbs={[
                    { label: 'Contabilidad', href: route('dashboard') },
                    { label: 'Partidas' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Partida
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por número o concepto..."
                        className="flex-1"
                    />
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="activa">Activas</option>
                        <option value="anulada">Anuladas</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredPartidas.length === 0 ? (
                    <EmptyState
                        icon={DocumentTextIcon}
                        title="No hay partidas"
                        description="Comienza registrando tu primera partida contable"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Partida
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Concepto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Debe</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Haber</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredPartidas.map((partida) => (
                                    <tr key={partida.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                            {partida.numero_partida}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {partida.fecha}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary-900">
                                            {partida.concepto}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-success-600">
                                            {formatCurrency(partida.total_debe)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-danger-600">
                                            {formatCurrency(partida.total_haber)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={partida.estado === 'activa' ? 'success' : 'danger'}>
                                                {partida.estado.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await axios.get(`/api/contabilidad/partidas/${partida.id}`);
                                                        // La API devuelve { partida: {...}, detalles: [...] }
                                                        // Combinamos para que selectedPartida tenga .detalles
                                                        setSelectedPartida({ ...res.data.partida, detalles: res.data.detalles });
                                                        setDetailModalOpen(true);
                                                    } catch (e) {
                                                        toast.error('Error al cargar detalles de la partida');
                                                    }
                                                }}
                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                                title="Ver Detalle"
                                            >
                                                <EyeIcon className="h-5 w-5 inline" />
                                            </button>
                                            {partida.estado === 'activa' && (
                                                <button
                                                    onClick={() => handleAnular(partida.id)}
                                                    className="text-danger-600 hover:text-danger-900"
                                                    title="Anular"
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

            {/* Modal Nueva Partida */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Partida Contable"
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Registrar Partida</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Número de Partida"
                            value={formData.numero_partida}
                            onChange={(e) => setFormData({ ...formData, numero_partida: e.target.value })}
                            placeholder="Auto-generado"
                        />
                        <Input
                            label="Fecha"
                            type="date"
                            required
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        />
                        <div />
                    </div>

                    <Input
                        label="Concepto"
                        required
                        value={formData.concepto}
                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                        placeholder="Descripción de la partida..."
                    />

                    <div className="border-t border-secondary-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-secondary-900">Movimientos (Partida Doble)</h3>
                            <Button type="button" size="sm" onClick={addDetalle}>
                                <PlusIcon className="h-4 w-4 mr-1" />Agregar Movimiento
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {formData.detalles.map((det, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end bg-secondary-50 p-3 rounded-lg">
                                    <div className="col-span-5">
                                        <select
                                            value={det.cuenta_id}
                                            onChange={(e) => updateDetalle(index, 'cuenta_id', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                        >
                                            <option value="">Seleccione Cuenta</option>
                                            {cuentas.map(cuenta => (
                                                <option key={cuenta.id} value={cuenta.id}>
                                                    {cuenta.codigo} - {cuenta.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={det.debe}
                                            onChange={(e) => updateDetalle(index, 'debe', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                            placeholder="Debe"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={det.haber}
                                            onChange={(e) => updateDetalle(index, 'haber', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                            placeholder="Haber"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            value={det.descripcion}
                                            onChange={(e) => updateDetalle(index, 'descripcion', e.target.value)}
                                            className="block w-full rounded-lg border-secondary-300 text-sm"
                                            placeholder="Descripción"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            onClick={() => removeDetalle(index)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 bg-secondary-100 p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-secondary-600">Total Debe</p>
                                    <p className="text-xl font-bold text-success-600">{formatCurrency(totales.debe)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-600">Total Haber</p>
                                    <p className="text-xl font-bold text-danger-600">{formatCurrency(totales.haber)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-600">Diferencia</p>
                                    <p className={`text-xl font-bold ${Math.abs(totales.diferencia) < 0.01 ? 'text-success-600' : 'text-danger-600'}`}>
                                        {formatCurrency(Math.abs(totales.diferencia))}
                                        {Math.abs(totales.diferencia) < 0.01 && <CheckCircleIcon className="h-5 w-5 inline ml-2" />}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal Detalle Partida */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Partida ${selectedPartida?.numero_partida}`}
                size="xl"
            >
                {selectedPartida && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-600">Fecha</p>
                                <p className="font-semibold">{selectedPartida.fecha}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Concepto</p>
                                <p className="font-semibold">{selectedPartida.concepto}</p>
                            </div>
                        </div>
                        <div className="border-t border-secondary-200 pt-4">
                            <h4 className="font-semibold mb-2">Movimientos</h4>
                            <table className="min-w-full">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs">Cuenta</th>
                                        <th className="px-4 py-2 text-right text-xs">Debe</th>
                                        <th className="px-4 py-2 text-right text-xs">Haber</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPartida.detalles?.map((det, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2">
                                                {det.cuenta?.codigo} - {det.cuenta?.nombre}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-success-600">
                                                {det.debe > 0 && formatCurrency(det.debe)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-danger-600">
                                                {det.haber > 0 && formatCurrency(det.haber)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-secondary-100 font-bold">
                                    <tr>
                                        <td className="px-4 py-2">TOTALES</td>
                                        <td className="px-4 py-2 text-right text-success-600">
                                            {formatCurrency(selectedPartida.total_debe)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-danger-600">
                                            {formatCurrency(selectedPartida.total_haber)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
