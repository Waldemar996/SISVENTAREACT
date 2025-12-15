import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
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
    const [cajas, setCajas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [sesionModalOpen, setSesionModalOpen] = useState(false);
    const [editingCaja, setEditingCaja] = useState(null);
    const [selectedCaja, setSelectedCaja] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre_caja: '',
        bodega_id: 1 // Default to 1
    });

    const [sesionData, setSesionData] = useState({
        monto_inicial: '0',
        observaciones_apertura: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/tesoreria/cajas');
            setCajas(response.data);
        } catch (error) {
            toast.error('Error al cargar cajas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (caja = null) => {
        if (caja) {
            setEditingCaja(caja);
            setFormData({
                nombre_caja: caja.nombre_caja,
                bodega_id: caja.bodega_id || 1
            });
        } else {
            setEditingCaja(null);
            setFormData({
                nombre_caja: '',
                bodega_id: 1
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
            if (editingCaja) {
                await axios.put(`/api/tesoreria/cajas/${editingCaja.id}`, formData);
                toast.success('Caja actualizada');
            } else {
                await axios.post('/api/tesoreria/cajas', formData);
                toast.success('Caja creada');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar caja');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta caja?')) return;
        try {
            await axios.delete(`/api/tesoreria/cajas/${id}`);
            toast.success('Caja eliminada');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleOpenSesion = (caja) => {
        setSelectedCaja(caja);
        setSesionData({
            monto_inicial: caja.saldo_actual || '0',
            observaciones_apertura: ''
        });
        setSesionModalOpen(true);
    };

    const handleAbrirSesion = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Use correct global route for session opening
            await axios.post('/api/tesoreria/sesion/aperturar', {
                ...sesionData,
                caja_id: selectedCaja.id
            });
            toast.success('Sesión abierta correctamente');
            setSesionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            // Handle specific backend error messages
            const msg = error.response?.data?.message || 'Error al abrir sesión';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCerrarSesion = async (cajaId) => {
        if (!confirm('¿Cerrar la sesión actual?')) return;

        // Backend requires closing amount. For now, simple prompt. 
        // ideally should show formatted system amount but we don't have it here without query.
        const montoReal = prompt("Ingrese el monto final real en caja (Efectivo contado):", "0");
        if (montoReal === null) return; // Cancelled

        try {
            await axios.post('/api/tesoreria/sesion/cerrar', {
                monto_final_real: parseFloat(montoReal) || 0
            });
            toast.success('Sesión cerrada correctamente');
            fetchData();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Error al cerrar sesión';
            toast.error(msg);
        }
    };

    const filteredCajas = cajas.filter(c => {
        if (!c) return false;
        const term = (searchTerm || '').toLowerCase();
        const nombre = (c.nombre_caja || '').toLowerCase();
        return nombre.includes(term);
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Cajas - Tesorería" />

            <PageHeader
                title="Gestión de Cajas"
                breadcrumbs={[
                    { label: 'Tesorería', href: route('tesoreria.cajas') },
                    { label: 'Cajas' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Caja
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar caja..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredCajas.length === 0 ? (
                    <EmptyState
                        icon={BanknotesIcon}
                        title="No hay cajas"
                        description="Crea cajas para gestionar el efectivo"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Caja
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCajas.map((caja) => (
                            <Card key={caja.id} padding="default" className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">{caja.nombre_caja}</h3>
                                        {caja.bodega && (
                                            <p className="text-xs text-slate-400 mt-1">{caja.bodega.nombre}</p>
                                        )}
                                    </div>
                                    <Badge variant={caja.sesion_activa ? 'success' : 'default'}>
                                        {caja.sesion_activa ? 'ABIERTA' : 'CERRADA'}
                                    </Badge>
                                </div>

                                <div className="border-t border-slate-200 pt-3 mt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Saldo Actual:</span>
                                        <span className="text-lg font-bold text-primary-600">
                                            {formatCurrency(caja.saldo_actual)}
                                        </span>
                                    </div>
                                    {caja.sesion_activa && caja.sesion_actual && (
                                        <div className="text-xs text-slate-500 mb-3">
                                            <div>Sesión: {caja.sesion_actual.numero_sesion}</div>
                                            <div>Apertura: {caja.sesion_actual.fecha_apertura}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    {!caja.sesion_activa ? (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={() => handleOpenSesion(caja)}
                                            className="flex-1"
                                        >
                                            <LockOpenIcon className="h-4 w-4 mr-1" />
                                            Abrir Sesión
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => handleCerrarSesion(caja.id)}
                                            className="flex-1"
                                        >
                                            <LockClosedIcon className="h-4 w-4 mr-1" />
                                            Cerrar Sesión
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleOpenModal(caja)}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(caja.id)}
                                        disabled={caja.sesion_activa}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal Crear/Editar Caja */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCaja ? 'Editar Caja' : 'Nueva Caja'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingCaja ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input label="Nombre de la Caja" required value={formData.nombre_caja}
                            onChange={(e) => setFormData({ ...formData, nombre_caja: e.target.value })} error={errors.nombre_caja?.[0]} />
                    </div>
                    {/* Bodega ID hardcoded to 1 for now or we need a select if multiple bodegas exist. 
                        User likely has 1 bodega. We send 1.
                    */}
                </form>
            </Modal>

            {/* Modal Abrir Sesión */}
            <Modal
                isOpen={sesionModalOpen}
                onClose={() => setSesionModalOpen(false)}
                title={`Abrir Sesión - ${selectedCaja?.nombre}`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSesionModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAbrirSesion} loading={saving}>Abrir Sesión</Button>
                    </>
                }
            >
                <form onSubmit={handleAbrirSesion} className="space-y-4">
                    <Input label="Monto Inicial" type="number" step="0.01" required value={sesionData.monto_inicial}
                        onChange={(e) => setSesionData({ ...sesionData, monto_inicial: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones</label>
                        <textarea value={sesionData.observaciones_apertura}
                            onChange={(e) => setSesionData({ ...sesionData, observaciones_apertura: e.target.value })}
                            rows={3} className="block w-full rounded-lg border-slate-300" />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
