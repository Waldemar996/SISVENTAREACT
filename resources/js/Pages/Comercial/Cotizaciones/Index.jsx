import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, DocumentTextIcon, EyeIcon, TrashIcon, PrinterIcon, PencilIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon, ShoppingCartIcon, Square2StackIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import SearchableSelect from '@/Components/UI/SearchableSelect';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingId, setEditingId] = useState(null); // New State

    const [formData, setFormData] = useState({
        cliente_id: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        observaciones: '',
        detalles: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [cotRes, cliRes, prodRes] = await Promise.all([
                axios.get('/api/comercial/cotizaciones'),
                axios.get('/api/comercial/clientes'),
                axios.get('/api/inventario/productos?all=true')
            ]);
            setCotizaciones(cotRes.data);
            setClientes(cliRes.data);
            // Handle pagination: prodRes.data.data if paginated, else prodRes.data
            const prods = prodRes.data.data || prodRes.data;
            setProductos(Array.isArray(prods) ? prods : []);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setIsViewMode(false);
        setEditingId(null); // Reset Editing
        setFormData({
            cliente_id: '',
            fecha_emision: new Date().toISOString().split('T')[0],
            fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observaciones: '',
            detalles: [{ producto_id: '', cantidad: 1, precio_unitario: 0 }]
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (editingId) {
                await axios.put(`/api/comercial/cotizaciones/${editingId}`, formData);
                toast.success('Cotización actualizada');
            } else {
                await axios.post('/api/comercial/cotizaciones', formData);
                toast.success('Cotización creada correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar cotización');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/comercial/cotizaciones/${id}`);
            const cot = res.data;

            setIsViewMode(false); // Editable
            setEditingId(id);
            setFormData({
                cliente_id: cot.cliente_id || '',
                fecha_emision: cot.fecha_emision ? cot.fecha_emision.split('T')[0] : '',
                fecha_vencimiento: cot.fecha_vencimiento ? cot.fecha_vencimiento.split('T')[0] : '',
                observaciones: cot.notas || '',
                detalles: (cot.detalles || []).map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario
                }))
            });
            setModalOpen(true);
        } catch (error) {
            toast.error('Error al cargar para editar');
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (id) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/comercial/cotizaciones/${id}`);
            const cot = res.data;

            setIsViewMode(true); // Enable View Mode
            setFormData({
                cliente_id: cot.cliente_id || '',
                fecha_emision: cot.fecha_emision ? cot.fecha_emision.split('T')[0] : '',
                fecha_vencimiento: cot.fecha_vencimiento ? cot.fecha_vencimiento.split('T')[0] : '',
                observaciones: cot.notas || '',
                detalles: (cot.detalles || []).map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario
                }))
            });
            setModalOpen(true);
        } catch (error) {
            toast.error('Error al cargar cotización');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!confirm(`¿Cambiar estado a ${newStatus.toUpperCase()}?`)) return;
        try {
            await axios.patch(`/api/comercial/cotizaciones/${id}/estado`, { estado: newStatus });
            toast.success(`Estado actualizado a ${newStatus}`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar estado');
        }
    };

    const handleConvert = async (id) => {
        if (!confirm('¿Convertir esta cotización en Venta (Factura)? Esto descontará inventario.')) return;
        try {
            const res = await axios.post(`/api/comercial/cotizaciones/${id}/convertir`);
            toast.success('¡Venta generada exitosamente!');
            // Opcional: Redirigir a la venta
            // window.location.href = `/operaciones/ventas/${res.data.venta_id}`;
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al facturar');
        }
    };

    const handleDuplicate = async (id) => {
        if (!confirm('¿Crear una COPIA de esta cotización? Se creará como BORRADOR.')) return;
        try {
            await axios.post(`/api/comercial/cotizaciones/${id}/duplicar`);
            toast.success('Cotización duplicada correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al duplicar');
        }
    };

    const handlePrint = (id) => {
        // Abrir en nueva ventana para imprimir
        window.open(`/comercial/cotizaciones/${id}/print`, '_blank');
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de DAR DE BAJA esta cotización? No se eliminará físicamente, pero quedará inactiva.')) return;
        try {
            await axios.delete(`/api/comercial/cotizaciones/${id}`);
            toast.success('Cotización dada de baja correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al dar de baja. Verifica el estado.');
        }
    };

    const addDetalle = () => {
        setFormData({
            ...formData,
            detalles: [...formData.detalles, { producto_id: '', cantidad: 1, precio_unitario: 0 }]
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

    const filteredCotizaciones = cotizaciones.filter(cot =>
        cot.numero_cotizacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cot.cliente?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEstadoBadge = (estado) => {
        const variants = {
            pendiente: 'warning',
            aprobada: 'success',
            rechazada: 'danger',
            vencida: 'default'
        };
        return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const calcularTotal = () => {
        return formData.detalles.reduce((sum, det) => {
            return sum + (parseFloat(det.cantidad) * parseFloat(det.precio_unitario || 0));
        }, 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Cotizaciones - Comercial" />

            <PageHeader
                title="Gestión de Cotizaciones"
                breadcrumbs={[
                    { label: 'Comercial', href: route('comercial.clientes') },
                    { label: 'Cotizaciones' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Cotización
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por número o cliente..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredCotizaciones.length === 0 ? (
                    <EmptyState
                        icon={DocumentTextIcon}
                        title="No hay cotizaciones"
                        description="Comienza creando tu primera cotización"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Cotización
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredCotizaciones.map((cot) => (
                                    <tr key={cot.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {cot.codigo_cotizacion || cot.numero_cotizacion}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {cot.cliente?.razon_social}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {cot.fecha_emision}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                                            {formatCurrency(cot.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(cot.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {/* Acciones para BORRADOR */}
                                            {cot.estado === 'borrador' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(cot.id, 'enviada')} className="text-blue-600 hover:text-blue-900 mr-3" title="Marcar como Enviada">
                                                        <PaperAirplaneIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleEdit(cot.id)} className="text-amber-600 hover:text-amber-900 mr-3" title="Editar">
                                                        <PencilIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleDuplicate(cot.id)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Duplicar">
                                                        <Square2StackIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handlePrint(cot.id)} className="text-gray-600 hover:text-gray-900 mr-3" title="Imprimir / PDF">
                                                        <PrinterIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleView(cot.id)} className="text-primary-600 hover:text-primary-900 mr-3" title="Ver Detalle">
                                                        <EyeIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleDelete(cot.id)} className="text-red-600 hover:text-red-900" title="Dar de baja">
                                                        <TrashIcon className="h-5 w-5 inline" />
                                                    </button>
                                                </>
                                            )}

                                            {/* Acciones para ENVIADA */}
                                            {cot.estado === 'enviada' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(cot.id, 'aprobada')} className="text-green-600 hover:text-green-900 mr-3" title="Aprobar (Cliente aceptó)">
                                                        <CheckCircleIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleStatusChange(cot.id, 'rechazada')} className="text-red-500 hover:text-red-800 mr-3" title="Rechazar">
                                                        <XCircleIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleDuplicate(cot.id)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Duplicar">
                                                        <Square2StackIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleView(cot.id)} className="text-primary-600 hover:text-primary-900 mr-3" title="Ver Detalle">
                                                        <EyeIcon className="h-5 w-5 inline" />
                                                    </button>
                                                </>
                                            )}

                                            {/* Acciones para APROBADA */}
                                            {cot.estado === 'aprobada' && (
                                                <>
                                                    <button onClick={() => handleConvert(cot.id)} className="text-emerald-700 hover:text-emerald-900 mr-3" title="Facturar (Convertir a Venta)">
                                                        <ShoppingCartIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handlePrint(cot.id)} className="text-gray-600 hover:text-gray-900 mr-3" title="Imprimir / PDF">
                                                        <PrinterIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleDuplicate(cot.id)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Duplicar">
                                                        <Square2StackIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleView(cot.id)} className="text-primary-600 hover:text-primary-900 mr-3" title="Ver Detalle">
                                                        <EyeIcon className="h-5 w-5 inline" />
                                                    </button>
                                                </>
                                            )}

                                            {/* Acciones para FINALIZADAS (Rechazada, Convertida) */}
                                            {['rechazada', 'convertida_venta'].includes(cot.estado) && (
                                                <>
                                                    <button onClick={() => handleDuplicate(cot.id)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Duplicar">
                                                        <Square2StackIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handleView(cot.id)} className="text-primary-600 hover:text-primary-900 mr-3" title="Ver Detalle">
                                                        <EyeIcon className="h-5 w-5 inline" />
                                                    </button>
                                                    <button onClick={() => handlePrint(cot.id)} className="text-gray-600 hover:text-gray-900 mr-3" title="Imprimir / PDF">
                                                        <PrinterIcon className="h-5 w-5 inline" />
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={isViewMode ? "Detalle de Cotización" : (editingId ? "Editar Cotización" : "Nueva Cotización")}
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            {isViewMode ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!isViewMode && <Button onClick={handleSubmit} loading={saving}>{editingId ? "Actualizar" : "Crear Cotización"}</Button>}
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form Fields Disabled if isViewMode */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                items={clientes}
                                selectedId={formData.cliente_id}
                                onChange={(val) => setFormData({ ...formData, cliente_id: val })}
                                placeholder="Buscar cliente (Razón Social/NIT)..."
                                displayKey="razon_social"
                                secondaryKey="nit"
                                disabled={isViewMode}
                            />
                        </div>
                        <Input label="Fecha Emisión" type="date" required value={formData.fecha_emision} disabled={isViewMode}
                            onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })} />
                        <Input label="Fecha Vencimiento" type="date" required value={formData.fecha_vencimiento} disabled={isViewMode}
                            onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })} />
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900">Productos</h3>
                            {!isViewMode && (
                                <Button type="button" size="sm" onClick={addDetalle}>
                                    <PlusIcon className="h-4 w-4 mr-1" />Agregar Producto
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {formData.detalles.map((det, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-6">
                                        <SearchableSelect
                                            items={productos}
                                            selectedId={det.producto_id}
                                            onChange={(val) => {
                                                const prod = productos.find(p => p.id == val);
                                                updateDetalle(index, 'producto_id', val);
                                                if (prod) updateDetalle(index, 'precio_unitario', prod.precio_venta_base);
                                            }}
                                            placeholder="Buscar producto (Nombre/SKU)..."
                                            displayKey="nombre"
                                            secondaryKey="codigo_sku"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" min="1" value={det.cantidad} disabled={isViewMode}
                                            onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100" placeholder="Cant." />
                                    </div>
                                    <div className="col-span-2">
                                        <input type="number" step="0.01" value={det.precio_unitario} disabled={isViewMode}
                                            onChange={(e) => updateDetalle(index, 'precio_unitario', e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-100" placeholder="Precio" />
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-sm font-medium text-slate-900">{formatCurrency(det.cantidad * det.precio_unitario)}</p>
                                    </div>
                                    <div className="col-span-1">
                                        {!isViewMode && (
                                            <Button type="button" size="sm" variant="danger" onClick={() => removeDetalle(index)}>
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-slate-600">Total</p>
                                <p className="text-2xl font-bold text-primary-600">{formatCurrency(calcularTotal())}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones</label>
                        <textarea value={formData.observaciones} disabled={isViewMode}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3} className="block w-full rounded-lg border-slate-300 disabled:bg-slate-100" />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
