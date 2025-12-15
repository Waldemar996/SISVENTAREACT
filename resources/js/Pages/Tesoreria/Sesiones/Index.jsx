import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import Modal from '@/Components/UI/Modal';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';
import Input from '@/Components/UI/Input';

export default function Index({ auth }) {
    const [sesiones, setSesiones] = useState([]);
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date().toISOString().split('T')[0],
        caja_id: ''
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSesion, setSelectedSesion] = useState(null);

    useEffect(() => {
        fetchCajas();
        fetchSesiones();
    }, []);

    useEffect(() => {
        fetchSesiones();
    }, [filters]);

    const fetchCajas = async () => {
        try {
            const res = await axios.get('/api/tesoreria/cajas');
            setCajas(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchSesiones = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/tesoreria/sesiones', { params: filters });
            setSesiones(res.data.data);
        } catch (error) {
            toast.error('Error al cargar cortes de caja');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const res = await axios.get(`/api/tesoreria/sesiones/${id}`);
            setSelectedSesion(res.data);
            setModalOpen(true);
        } catch (error) {
            toast.error('Error al cargar detalles');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('es-GT');
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Reporte de Cortes de Caja" />

            <PageHeader
                title="Historial de Cortes de Caja"
                breadcrumbs={[
                    { label: 'Tesorería', href: '#' },
                    { label: 'Ver Cortes' }
                ]}
            />

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Input
                        label="Fecha Inicio"
                        type="date"
                        value={filters.fecha_inicio}
                        onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                    />
                    <Input
                        label="Fecha Fin"
                        type="date"
                        value={filters.fecha_fin}
                        onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Caja</label>
                        <select
                            value={filters.caja_id}
                            onChange={(e) => setFilters({ ...filters, caja_id: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">Todas</option>
                            {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="secondary" onClick={fetchSesiones} className="w-full">
                            Filtrar
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : sesiones.length === 0 ? (
                    <EmptyState
                        icon={PrinterIcon}
                        title="No hay cortes registrados"
                        description="Ajusta los filtros para ver resultados"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Apertura</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Cierre</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Caja / Usuario</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Inicial</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Final (Real)</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Diferencia</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {sesiones.map((sesion) => (
                                    <tr key={sesion.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {formatDateTime(sesion.fecha_apertura)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {sesion.fecha_cierre ? formatDateTime(sesion.fecha_cierre) : <span className="text-slate-400 italic">En curso</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="font-medium">{sesion.caja?.nombre || 'Caja Desconocida'}</div>
                                            <div className="text-xs">{sesion.usuario?.nombre || 'Usuario Desconocido'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                                            {formatCurrency(sesion.monto_inicial)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                                            {sesion.estado === 'cerrada' ? formatCurrency(sesion.monto_final_real) : '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${sesion.estado !== 'cerrada' ? 'text-slate-400' :
                                            sesion.diferencia < 0 ? 'text-red-500' : sesion.diferencia > 0 ? 'text-green-500' : 'text-slate-500'
                                            }`}>
                                            {sesion.estado === 'cerrada' ? formatCurrency(sesion.diferencia) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Badge variant={sesion.estado === 'cerrada' ? 'success' : 'warning'}>
                                                {sesion.estado ? sesion.estado.toUpperCase() : 'DESCONOCIDO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleViewDetails(sesion.id)}
                                                className="text-primary-600 hover:text-primary-900"
                                            >
                                                <EyeIcon className="h-5 w-5" />
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
                title="Detalle de Corte de Caja"
                size="lg"
                footer={<Button onClick={() => setModalOpen(false)}>Cerrar</Button>}
            >
                {selectedSesion && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                            <div>
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cajero</h4>
                                <p className="font-semibold">{selectedSesion.usuario?.nombre}</p>
                            </div>
                            <div>
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">Periodo</h4>
                                <p className="text-sm">In: {formatDateTime(selectedSesion.fecha_apertura)}</p>
                                <p className="text-sm">Out: {formatDateTime(selectedSesion.fecha_cierre)}</p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">Concepto</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr>
                                        <td className="px-4 py-2 text-sm">Fondo Inicial</td>
                                        <td className="px-4 py-2 text-right text-sm">{formatCurrency(selectedSesion.monto_inicial)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm font-medium text-blue-600">Ventas Efectivo (+)</td>
                                        <td className="px-4 py-2 text-right text-sm text-blue-600">{formatCurrency(selectedSesion.total_efectivo)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm text-slate-500">Ventas Digitales (Tarjeta/Transf)</td>
                                        <td className="px-4 py-2 text-right text-sm text-slate-500">
                                            {formatCurrency((Number(selectedSesion.total_tarjeta) || 0) + (Number(selectedSesion.total_transferencia) || 0) + (Number(selectedSesion.total_otros) || 0))}
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                                        <td className="px-4 py-2 text-sm">Total Esperado en Caja (Efectivo)</td>
                                        <td className="px-4 py-2 text-right text-sm">{formatCurrency(selectedSesion.monto_final_sistema)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm">Total Real (Arqueo)</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold">{formatCurrency(selectedSesion.monto_final_real)}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm text-red-600">Diferencia</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-red-600">{formatCurrency(selectedSesion.diferencia)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Desglose de Ventas ({selectedSesion.ventas?.length || 0})</h4>
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600"># Factura</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Hora</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {selectedSesion.ventas?.map(venta => (
                                            <tr key={venta.id}>
                                                <td className="px-4 py-2 text-sm">{venta.numero_factura}</td>
                                                <td className="px-4 py-2 text-sm text-slate-500">
                                                    {new Date(venta.fecha_emision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-2 text-right text-sm">{formatCurrency(venta.total_venta)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
