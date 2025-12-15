import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, EyeIcon, TrashIcon, DocumentTextIcon,
    PrinterIcon, XCircleIcon, CheckCircleIcon, ShoppingCartIcon, TicketIcon
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
    const [ventas, setVentas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        cliente_id: '',
        fecha_venta: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        observaciones: '',
        detalles: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [ventasRes, clientesRes, productosRes] = await Promise.all([
                axios.get('/api/operaciones/ventas'),
                axios.get('/api/comercial/clientes?all=true'), // Asumo que clientes también necesita esto
                axios.get('/api/inventario/productos?all=true')
            ]);
            setVentas(ventasRes.data);

            // Handle Clients Data (Paginated or Flat)
            const cliData = clientesRes.data.data || clientesRes.data;
            setClientes(Array.isArray(cliData) ? cliData : []);

            // Handle Products Data (Paginated or Flat)
            const prodData = productosRes.data.data || productosRes.data;
            setProductos(Array.isArray(prodData) ? prodData : []);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            cliente_id: '',
            fecha_venta: new Date().toISOString().split('T')[0],
            metodo_pago: 'efectivo',
            observaciones: '',
            detalles: []
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.cliente_id) {
            toast.error('Seleccione un cliente');
            return;
        }

        if (formData.detalles.length === 0 || formData.detalles.some(d => !d.producto_id || d.cantidad <= 0)) {
            toast.error('Agregue al menos un producto válido con cantidad mayor a cero');
            return;
        }

        setSaving(true);
        setErrors({}); // Clear previous errors

        try {
            // Prepare data
            const dataToSend = {
                ...formData,
                tipo_comprobante: formData.tipo_comprobante || 'FACTURA', // Default
            };

            const res = await axios.post('/api/operaciones/ventas', dataToSend);
            toast.success('Venta registrada');

            // Auto-Print
            if (res.data && res.data.id) {
                window.open(`/operaciones/ventas/${res.data.id}/print`, '_blank');
            }

            // Reset form
            setFormData({
                cliente_id: '',
                fecha_venta: new Date().toISOString().split('T')[0], // Keep current date
                metodo_pago: 'efectivo',
                observaciones: '',
                bodega_id: 1,
                tipo_comprobante: 'FACTURA',
                condicion_pago: 'contado',
                detalles: [] // Reset to empty
            });
            setModalOpen(false); // Close modal after successful submission
            fetchData(); // Refresh data
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            console.error(error);
            toast.error('Error al registrar venta');
        } finally {
            setSaving(false);
        }
    };

    const handleAnular = async (id) => {
        if (!confirm('¿Está seguro de anular esta venta? Esta acción no se puede deshacer.')) return;

        try {
            await axios.post(`/api/operaciones/ventas/${id}/anular`);
            toast.success('Venta anulada correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al anular venta');
        }
    };

    const handlePrint = (id) => {
        window.open(`/operaciones/ventas/${id}/print`, '_blank');
    };

    const handleTicket = (id) => {
        window.open(`/operaciones/ventas/${id}/ticket`, '_blank');
    };

    const addDetalle = () => {
        setFormData({
            ...formData,
            detalles: [...formData.detalles, { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }]
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

        if (field === 'producto_id') {
            const producto = productos.find(p => p.id == value);
            if (producto) {
                newDetalles[index].precio_unitario = producto.precio_venta_base;
            }
        }

        setFormData({ ...formData, detalles: newDetalles });
    };

    const calcularSubtotal = (detalle) => {
        const subtotal = detalle.cantidad * detalle.precio_unitario;
        const descuento = (subtotal * detalle.descuento) / 100;
        return subtotal - descuento;
    };

    const calcularTotal = () => {
        return formData.detalles.reduce((sum, det) => sum + calcularSubtotal(det), 0);
    };

    const filteredVentas = ventas.filter(v => {
        const matchesSearch = v.numero_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.cliente?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado === 'all' || v.estado === filterEstado;
        return matchesSearch && matchesEstado;
    });

    const getEstadoBadge = (estado) => {
        const variants = {
            completada: 'success',
            pendiente: 'warning',
            anulada: 'danger',
            facturada: 'info'
        };
        return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Ventas - Operaciones" />

            <PageHeader
                title="Gestión de Ventas"
                breadcrumbs={[
                    { label: 'Operaciones', href: route('dashboard') },
                    { label: 'Ventas' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Venta
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por número o cliente..."
                        className="flex-1"
                    />
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="completada">Completadas</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="facturada">Facturadas</option>
                        <option value="anulada">Anuladas</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredVentas.length === 0 ? (
                    <EmptyState
                        icon={DocumentTextIcon}
                        title="No hay ventas"
                        description="Comienza registrando tu primera venta"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Venta
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Método Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredVentas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                            {venta.numero_comprobante}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {new Date(venta.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {venta.cliente?.razon_social || 'Cliente Final'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {venta.metodo_pago?.toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                                            {formatCurrency(venta.total_venta)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(venta.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setSelectedVenta(venta);
                                                    setDetailModalOpen(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-900 mr-3"
                                                title="Ver Detalle"
                                            >
                                                <EyeIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(venta.id)}
                                                className="text-info-600 hover:text-info-900 mr-3" title="Imprimir Factura"
                                            >
                                                <PrinterIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleTicket(venta.id)}
                                                className="text-secondary-600 hover:text-secondary-900 mr-3" title="Imprimir Ticket"
                                            >
                                                <TicketIcon className="h-5 w-5 inline" />
                                            </button>
                                            {venta.estado !== 'anulada' && (
                                                <button
                                                    onClick={() => handleAnular(venta.id)}
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

            {/* Modal Nueva Venta */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Venta"
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Registrar Venta</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Cliente <span className="text-danger-500">*</span>
                            </label>
                            <SearchableSelect
                                items={clientes}
                                selectedId={formData.cliente_id}
                                onChange={(val) => setFormData({ ...formData, cliente_id: val })}
                                placeholder="Buscar cliente..."
                                displayKey="razon_social"
                                secondaryKey="nit"
                            />
                        </div>
                        <Input
                            label="Fecha de Venta"
                            type="date"
                            required
                            value={formData.fecha_venta}
                            onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Método de Pago</label>
                            <select
                                value={formData.metodo_pago}
                                onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-secondary-200 pt-4">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Productos</h3>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Producto / Escanear Código</label>
                            <div className="relative">
                                <SearchableSelect
                                    items={productos}
                                    selectedId={null} // Always reset after selection
                                    onChange={(val) => {
                                        if (!val) return;
                                        const prod = productos.find(p => p.id === val);
                                        if (prod) {
                                            // Check stock
                                            if (prod.stock_total !== undefined && prod.stock_total < 1) {
                                                toast.error(`Stock insuficiente. Disponible: ${prod.stock_total}`);
                                                return;
                                            }
                                            // Add to details
                                            setFormData(prev => ({
                                                ...prev,
                                                detalles: [
                                                    ...prev.detalles,
                                                    {
                                                        producto_id: prod.id,
                                                        nombre_producto: prod.nombre, // Store for display
                                                        codigo_sku: prod.codigo_sku,
                                                        cantidad: 1,
                                                        precio_unitario: prod.precio_venta_base,
                                                        descuento: 0
                                                    }
                                                ]
                                            }));
                                            toast.success(`Agregado: ${prod.nombre}`);
                                        }
                                    }}
                                    placeholder="Escribe para buscar o escanea..."
                                    displayKey="nombre"
                                    secondaryKey="codigo_sku"
                                    autoFocus // Helper for scanners
                                />
                            </div>
                            <div className="border rounded-lg overflow-hidden border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Producto</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dto %</th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                            <th scope="col" className="relative px-3 py-2 w-10"><span className="sr-only">Eliminar</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {formData.detalles.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-3 py-8 text-center text-gray-400 text-sm">
                                                    No hay productos agregados. Usa el buscador de arriba.
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.detalles.map((det, index) => (
                                                <tr key={index} className="hover:bg-gray-50 font-medium">
                                                    <td className="px-3 py-2">
                                                        <div className="text-sm text-gray-900 truncate max-w-[250px]" title={det.nombre_producto}>
                                                            {det.nombre_producto || productos.find(p => p.id === det.producto_id)?.nombre}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{det.codigo_sku}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={det.cantidad}
                                                            onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                                                            className="block w-20 ml-auto rounded border-gray-300 text-sm py-1 px-2 text-right focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="relative rounded-md shadow-sm w-24 ml-auto">
                                                            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                                                                <span className="text-gray-500 sm:text-xs">Q</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={det.precio_unitario}
                                                                onChange={(e) => updateDetalle(index, 'precio_unitario', e.target.value)}
                                                                className="block w-full rounded border-gray-300 pl-4 py-1 px-2 text-sm text-right focus:ring-primary-500 focus:border-primary-500"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={det.descuento || 0}
                                                            onChange={(e) => updateDetalle(index, 'descuento', e.target.value)}
                                                            className="block w-16 mx-auto rounded border-gray-300 text-sm py-1 px-1 text-center focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                                        {formatCurrency(calcularSubtotal(det))}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDetalle(index)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="4" className="px-3 py-3 text-right text-sm font-medium text-gray-600">Total Venta:</td>
                                            <td className="px-3 py-3 text-right text-lg font-bold text-primary-600">
                                                {formatCurrency(calcularTotal())}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-secondary-600">Total</p>
                                <p className="text-3xl font-bold text-primary-600">{formatCurrency(calcularTotal())}</p>
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

            {/* Modal Detalle Venta */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Detalle de Venta - ${selectedVenta?.numero_venta}`}
                size="xl"
            >
                {selectedVenta && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-600">Cliente</p>
                                <p className="font-semibold">{selectedVenta.cliente?.razon_social}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Fecha</p>
                                <p className="font-semibold">{selectedVenta.fecha_venta}</p>
                            </div>
                        </div>
                        <div className="border-t border-secondary-200 pt-4">
                            <h4 className="font-semibold mb-2">Productos</h4>
                            <table className="min-w-full">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs">Producto</th>
                                        <th className="px-4 py-2 text-right text-xs">Cantidad</th>
                                        <th className="px-4 py-2 text-right text-xs">Precio</th>
                                        <th className="px-4 py-2 text-right text-xs">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVenta.detalles?.map((det, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2">{det.producto?.nombre}</td>
                                            <td className="px-4 py-2 text-right">{det.cantidad}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(det.precio_unitario)}</td>
                                            <td className="px-4 py-2 text-right font-semibold">
                                                {formatCurrency(det.cantidad * det.precio_unitario)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end border-t pt-4">
                            <div className="text-right">
                                <p className="text-secondary-600">Total</p>
                                <p className="text-2xl font-bold text-primary-600">
                                    {formatCurrency(selectedVenta.total)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
