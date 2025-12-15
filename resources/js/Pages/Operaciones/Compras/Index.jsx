import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, EyeIcon, TrashIcon, TruckIcon,
    DocumentCheckIcon, XCircleIcon
} from '@heroicons/react/24/outline';
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
    const [compras, setCompras] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        proveedor_id: '',
        bodega_id: 1, // Default Bodega
        tipo_comprobante: 'FACTURA',
        estado: 'COMPLETADO',
        fecha_compra: new Date().toISOString().split('T')[0],
        numero_factura: '',
        metodo_pago: 'credito',
        observaciones: '',
        detalles: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [comprasRes, provRes, prodRes] = await Promise.all([
                axios.get('/api/operaciones/compras'),
                axios.get('/api/comercial/proveedores?all=true'),
                axios.get('/api/inventario/productos?all=true')
            ]);
            // Fix: Handle pagination (extract .data)
            setCompras(comprasRes.data.data || comprasRes.data);

            const provData = provRes.data.data || provRes.data;
            setProveedores(Array.isArray(provData) ? provData : []);

            const prodData = prodRes.data.data || prodRes.data;
            setProductos(Array.isArray(prodData) ? prodData : []);
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            proveedor_id: '',
            bodega_id: 1,
            tipo_comprobante: 'FACTURA',
            fecha_compra: new Date().toISOString().split('T')[0],
            numero_factura: '',
            metodo_pago: 'credito',
            observaciones: '',
            detalles: []
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.proveedor_id) {
            toast.error('Seleccione un proveedor');
            return;
        }

        if (formData.detalles.length === 0) {
            toast.error('Agregue al menos un producto');
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            await axios.post('/api/operaciones/compras', formData);
            toast.success('Compra registrada correctamente');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al registrar compra');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleAnular = async (id) => {
        if (!confirm('¿Está seguro de anular esta compra? Esto revertirá el stock.')) return;
        try {
            await axios.delete(`/api/operaciones/compras/${id}`);
            toast.success('Compra anulada y stock revertido');
            fetchData();
        } catch (error) {
            toast.error('Error al anular compra');
        }
    };



    // Helper to add/update details
    // We do NOT use legacy add/remove buttons anymore, we use the search bar logic primarily
    const removeDetalle = (index) => {
        setFormData(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    const updateDetalle = (index, field, value) => {
        const newDetalles = [...formData.detalles];
        newDetalles[index][field] = value;

        // Recalculate subtotal is automatic in render for view, 
        // but if we stored it, we'd update it here.
        // Important: Update cost if product changes? (Not typical in this flow since row exists)
        setFormData({ ...formData, detalles: newDetalles });
    };

    const calcularTotal = () => {
        return formData.detalles.reduce((sum, det) => sum + (det.cantidad * det.costo_unitario), 0);
    };

    // Safe filter
    const filteredCompras = Array.isArray(compras) ? compras.filter(c => {
        const term = searchTerm.toLowerCase();
        return (
            (c.numero_comprobante && c.numero_comprobante.toLowerCase().includes(term)) ||
            (c.numero_factura && c.numero_factura.toLowerCase().includes(term)) ||
            (c.proveedor?.razon_social && c.proveedor.razon_social.toLowerCase().includes(term))
        );
    }) : [];

    const handleRecibir = async (id) => {
        if (!confirm('¿Confirmar recepción de mercadería? Esto sumará el stock.')) return;
        try {
            await axios.post(`/api/operaciones/compras/${id}/recibir`);
            toast.success('Recibido exitosamente');
            fetchData();
        } catch (error) {
            toast.error('Error al recibir mercadería');
        }
    };

    const handleVerDetalle = async (id) => {
        try {
            const res = await axios.get(`/api/operaciones/compras/${id}`);
            setSelectedCompra(res.data);
            setDetailModalOpen(true);
        } catch (error) {
            toast.error('Error al cargar detalles');
        }
    };

    const getEstadoBadge = (estado) => {
        const variants = { pendiente: 'warning', completado: 'success', anulado: 'danger' };
        return <Badge variant={variants[estado.toLowerCase()] || 'info'}>{estado.toUpperCase()}</Badge>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Compras" />

            <PageHeader
                title="Gestión de Compras"
                breadcrumbs={[{ label: 'Operaciones', href: route('dashboard') }, { label: 'Compras' }]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" /> Nueva Compra
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por número, factura o proveedor..."
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredCompras.length === 0 ? (
                    <EmptyState
                        icon={TruckIcon}
                        title="No hay compras"
                        description="Registra tu primera compra."
                        action={<Button onClick={handleOpenModal}>Crear Compra</Button>}
                    />
                ) : (
                    <div className="overflow-x-auto border rounded-lg border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Factura</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Proveedor</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Productos</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCompras.map((compra) => (
                                    <tr key={compra.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.numero_comprobante}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.numero_factura || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(compra.fecha_emision).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{compra.proveedor?.razon_social}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                                            <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded-full text-xs font-bold">
                                                {compra.detalles_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 text-right">{formatCurrency(compra.total_compra)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">{getEstadoBadge(compra.estado)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleVerDetalle(compra.id)}
                                                className="text-primary-600 hover:text-primary-900 mr-3" title="Ver"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            {compra.estado === 'PENDIENTE' && (
                                                <button
                                                    onClick={() => handleRecibir(compra.id)}
                                                    className="text-green-600 hover:text-green-900 mr-3" title="Recibir Mercadería"
                                                >
                                                    <TruckIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            {compra.estado !== 'ANULADO' && (
                                                <button
                                                    onClick={() => handleAnular(compra.id)}
                                                    className="text-red-600 hover:text-red-900" title="Anular"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
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

            {/* Modal Nueva Compra - Advanced Layout */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Compra"
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Registrar Compra</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Header Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                items={proveedores}
                                selectedId={formData.proveedor_id}
                                onChange={(val) => setFormData({ ...formData, proveedor_id: val })}
                                placeholder="Buscar proveedor..."
                                displayKey="razon_social"
                                secondaryKey="nit"
                            />
                        </div>
                        <Input
                            label="Fecha Compra"
                            type="date"
                            value={formData.fecha_compra}
                            onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                        />
                        <Input
                            label="No. Factura"
                            onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                            placeholder="Ej: FAC-12345"
                        />
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
                            <select
                                value={formData.estado || 'COMPLETADO'}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="COMPLETADO">Completado (Sumar Stock)</option>
                                <option value="PENDIENTE">Pendiente (Orden de Compra)</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Entry - Single Bar */}
                    <div className="pt-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Productos</h3>
                        <div className="mb-4">
                            <SearchableSelect
                                items={productos}
                                selectedId={null}
                                onChange={(val) => {
                                    if (!val) return;
                                    const prod = productos.find(p => p.id === val);
                                    if (prod) {
                                        setFormData(prev => ({
                                            ...prev,
                                            detalles: [
                                                ...prev.detalles,
                                                {
                                                    producto_id: prod.id,
                                                    nombre: prod.nombre,
                                                    codigo_sku: prod.codigo_sku,
                                                    cantidad: 1,
                                                    costo_unitario: prod.costo_promedio || 0
                                                }
                                            ]
                                        }));
                                        toast.success(`Agregado: ${prod.nombre}`);
                                    }
                                }}
                                placeholder="Escribe para buscar producto o escanea código..."
                                displayKey="nombre"
                                secondaryKey="codigo_sku"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Table Layout */}
                    <div className="border rounded-lg overflow-hidden border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase w-[40%]">Producto</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Cantidad</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Costo Unit.</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Subtotal</th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-500 uppercase w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.detalles.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-400 text-sm">No hay productos. Usa el buscador.</td></tr>
                                ) : (
                                    formData.detalles.map((det, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <div className="text-sm font-medium text-gray-900">{det.nombre}</div>
                                                <div className="text-xs text-gray-500">{det.codigo_sku}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <input
                                                    type="number" min="1"
                                                    value={det.cantidad}
                                                    onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                                                    className="block w-20 ml-auto rounded border-gray-300 text-sm py-1 px-2 text-right focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="relative rounded-md shadow-sm w-28 ml-auto">
                                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-xs">Q</span></div>
                                                    <input
                                                        type="number" step="0.01"
                                                        value={det.costo_unitario}
                                                        onChange={(e) => updateDetalle(index, 'costo_unitario', e.target.value)}
                                                        className="block w-full rounded border-gray-300 pl-5 py-1 px-2 text-sm text-right focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                                {formatCurrency(det.cantidad * det.costo_unitario)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button onClick={() => removeDetalle(index)} className="text-red-500 hover:text-red-700 p-1">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="3" className="px-3 py-3 text-right text-sm font-medium text-gray-600">Total Compra:</td>
                                    <td className="px-3 py-3 text-right text-lg font-bold text-primary-600">{formatCurrency(calcularTotal())}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                        <textarea
                            rows={2}
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            className="block w-full rounded-lg border-gray-300"
                        />
                    </div>
                </div>
            </Modal>

            {/* Detail View Modal (Read-Only) */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Detalle Compra: ${selectedCompra?.numero_comprobante || ''}`}
                size="xl"
            >
                {selectedCompra && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Proveedor:</span> <span className="font-semibold">{selectedCompra.proveedor?.razon_social}</span></div>
                            <div><span className="text-gray-500">Fecha:</span> <span className="font-semibold">{new Date(selectedCompra.fecha_emision).toLocaleDateString()}</span></div>
                            <div><span className="text-gray-500">Factura:</span> <span className="font-semibold">{selectedCompra.numero_factura || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Estado:</span> {getEstadoBadge(selectedCompra.estado)}</div>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Producto</th>
                                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Cant</th>
                                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Costo</th>
                                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {selectedCompra.detalles?.map((d, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0">
                                            <td className="px-4 py-2 text-sm">{d.producto?.nombre}</td>
                                            <td className="px-4 py-2 text-sm text-right">{d.cantidad}</td>
                                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(d.costo_unitario)}</td>
                                            <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(d.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-right pt-2 border-t border-gray-200">
                            <span className="text-gray-600 mr-2">Total Total:</span>
                            <span className="text-xl font-bold text-primary-600">{formatCurrency(selectedCompra.total_compra)}</span>
                        </div>
                    </div>
                )}
            </Modal>

        </AuthenticatedLayout>
    );
}
