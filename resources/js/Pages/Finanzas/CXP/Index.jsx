import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, BanknotesIcon, DocumentTextIcon,
    ClockIcon, CheckCircleIcon, ExclamationTriangleIcon
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
    const [cuentas, setCuentas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [filterVencimiento, setFilterVencimiento] = useState('all');
    const [pagoModalOpen, setPagoModalOpen] = useState(false);
    const [selectedCuenta, setSelectedCuenta] = useState(null);
    const [saving, setSaving] = useState(false);

    const [pagoData, setPagoData] = useState({
        monto: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia',
        numero_referencia: '',
        observaciones: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [cuentasRes, provRes] = await Promise.all([
                axios.get('/api/finanzas/cuentas-por-pagar'),
                axios.get('/api/comercial/proveedores')
            ]);
            setCuentas(cuentasRes.data);
            setProveedores(provRes.data);
        } catch (error) {
            toast.error('Error al cargar cuentas por pagar');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPagoModal = (cuenta) => {
        setSelectedCuenta(cuenta);
        setPagoData({
            monto: cuenta.saldo_pendiente,
            fecha_pago: new Date().toISOString().split('T')[0],
            metodo_pago: 'transferencia',
            numero_referencia: '',
            observaciones: ''
        });
        setPagoModalOpen(true);
    };

    const handleRegistrarPago = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await axios.post(`/api/finanzas/cuentas-por-pagar/${selectedCuenta.id}/pago`, pagoData);
            toast.success('Pago registrado correctamente');
            setPagoModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Error al registrar pago');
        } finally {
            setSaving(false);
        }
    };

    const getDiasVencidos = (fechaVencimiento) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diff = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getEstadoVencimiento = (fechaVencimiento) => {
        const dias = getDiasVencidos(fechaVencimiento);
        if (dias < 0) return { label: 'Por Vencer', variant: 'info', dias: Math.abs(dias) };
        if (dias === 0) return { label: 'Vence Hoy', variant: 'warning', dias: 0 };
        if (dias <= 30) return { label: '1-30 días', variant: 'warning', dias };
        if (dias <= 60) return { label: '31-60 días', variant: 'danger', dias };
        return { label: '+60 días', variant: 'danger', dias };
    };

    const filteredCuentas = cuentas.filter(c => {
        const matchesSearch = c.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.proveedor?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado === 'all' || c.estado === filterEstado;

        let matchesVencimiento = true;
        if (filterVencimiento !== 'all') {
            const dias = getDiasVencidos(c.fecha_vencimiento);
            switch (filterVencimiento) {
                case 'por_vencer': matchesVencimiento = dias < 0; break;
                case '1-30': matchesVencimiento = dias >= 0 && dias <= 30; break;
                case '31-60': matchesVencimiento = dias >= 31 && dias <= 60; break;
                case '+60': matchesVencimiento = dias > 60; break;
            }
        }

        return matchesSearch && matchesEstado && matchesVencimiento;
    });

    const calcularTotales = () => {
        return {
            total: filteredCuentas.reduce((sum, c) => sum + c.monto_total, 0),
            pendiente: filteredCuentas.reduce((sum, c) => sum + c.saldo_pendiente, 0),
            pagado: filteredCuentas.reduce((sum, c) => sum + (c.monto_total - c.saldo_pendiente), 0)
        };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const totales = calcularTotales();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Cuentas por Pagar" />

            <PageHeader
                title="Cuentas por Pagar (CXP)"
                breadcrumbs={[
                    { label: 'Finanzas', href: route('dashboard') },
                    { label: 'Cuentas por Pagar' }
                ]}
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600">Total por Pagar</p>
                            <p className="text-2xl font-bold text-danger-600">{formatCurrency(totales.pendiente)}</p>
                        </div>
                        <div className="p-3 bg-danger-100 rounded-full">
                            <ExclamationTriangleIcon className="h-8 w-8 text-danger-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600">Total Pagado</p>
                            <p className="text-2xl font-bold text-success-600">{formatCurrency(totales.pagado)}</p>
                        </div>
                        <div className="p-3 bg-success-100 rounded-full">
                            <CheckCircleIcon className="h-8 w-8 text-success-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-secondary-600">Documentos Pendientes</p>
                            <p className="text-2xl font-bold text-warning-600">
                                {filteredCuentas.filter(c => c.estado === 'pendiente').length}
                            </p>
                        </div>
                        <div className="p-3 bg-warning-100 rounded-full">
                            <ClockIcon className="h-8 w-8 text-warning-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por documento o proveedor..."
                        className="flex-1"
                    />
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="parcial">Parciales</option>
                        <option value="pagado">Pagados</option>
                    </select>
                    <select
                        value={filterVencimiento}
                        onChange={(e) => setFilterVencimiento(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los vencimientos</option>
                        <option value="por_vencer">Por Vencer</option>
                        <option value="1-30">1-30 días vencidos</option>
                        <option value="31-60">31-60 días vencidos</option>
                        <option value="+60">+60 días vencidos</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredCuentas.length === 0 ? (
                    <EmptyState
                        icon={DocumentTextIcon}
                        title="No hay cuentas por pagar"
                        description="No se encontraron documentos pendientes de pago"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Proveedor</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Fecha Emisión</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Vencimiento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Saldo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredCuentas.map((cuenta) => {
                                    const estadoVenc = getEstadoVencimiento(cuenta.fecha_vencimiento);
                                    return (
                                        <tr key={cuenta.id} className="hover:bg-secondary-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                                {cuenta.numero_documento}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                {cuenta.proveedor?.razon_social}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                                {cuenta.fecha_emision}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-900">{cuenta.fecha_vencimiento}</div>
                                                <Badge variant={estadoVenc.variant} size="sm">
                                                    {estadoVenc.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary-900">
                                                {formatCurrency(cuenta.monto_total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-danger-600">
                                                {formatCurrency(cuenta.saldo_pendiente)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={
                                                    cuenta.estado === 'pagado' ? 'success' :
                                                        cuenta.estado === 'parcial' ? 'warning' : 'danger'
                                                }>
                                                    {cuenta.estado.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {cuenta.estado !== 'pagado' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenPagoModal(cuenta)}
                                                    >
                                                        <BanknotesIcon className="h-4 w-4 mr-1" />
                                                        Registrar Pago
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Registrar Pago */}
            <Modal
                isOpen={pagoModalOpen}
                onClose={() => setPagoModalOpen(false)}
                title={`Registrar Pago - ${selectedCuenta?.numero_documento}`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPagoModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleRegistrarPago} loading={saving}>Registrar Pago</Button>
                    </>
                }
            >
                <form onSubmit={handleRegistrarPago} className="space-y-4">
                    <div className="bg-secondary-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-secondary-600">Monto Total:</span>
                            <span className="font-semibold">{formatCurrency(selectedCuenta?.monto_total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary-600">Saldo Pendiente:</span>
                            <span className="font-bold text-danger-600">{formatCurrency(selectedCuenta?.saldo_pendiente)}</span>
                        </div>
                    </div>

                    <Input
                        label="Monto a Pagar"
                        type="number"
                        step="0.01"
                        required
                        value={pagoData.monto}
                        onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
                        max={selectedCuenta?.saldo_pendiente}
                    />

                    <Input
                        label="Fecha de Pago"
                        type="date"
                        required
                        value={pagoData.fecha_pago}
                        onChange={(e) => setPagoData({ ...pagoData, fecha_pago: e.target.value })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Método de Pago</label>
                        <select
                            value={pagoData.metodo_pago}
                            onChange={(e) => setPagoData({ ...pagoData, metodo_pago: e.target.value })}
                            className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="transferencia">Transferencia</option>
                            <option value="cheque">Cheque</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                        </select>
                    </div>

                    <Input
                        label="Número de Referencia"
                        value={pagoData.numero_referencia}
                        onChange={(e) => setPagoData({ ...pagoData, numero_referencia: e.target.value })}
                        placeholder="Ej: TRANS-12345"
                    />

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Observaciones</label>
                        <textarea
                            value={pagoData.observaciones}
                            onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                        />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
