import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, EyeIcon, ArrowUturnLeftIcon, DocumentTextIcon
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
    const [devoluciones, setDevoluciones] = useState([]);
    // const [ventas, setVentas] = useState([]); // Removed: We search on demand now
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState(''); // New state for modal search
    const [searchingInvoice, setSearchingInvoice] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // Autocomplete results
    const [showResults, setShowResults] = useState(false);
    const [filterTipo, setFilterTipo] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDevolucion, setSelectedDevolucion] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        tipo: 'venta',
        venta_id: '',
        fecha_devolucion: new Date().toISOString().split('T')[0],
        motivo: '',
        observaciones: '',
        detalles: []
    });

    const [errors, setErrors] = useState({});

    const motivos = [
        'Producto defectuoso',
        'Producto incorrecto',
        'Cliente insatisfecho',
        'Error en facturación',
        'Cambio de producto',
        'Otro'
    ];

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (invoiceSearch.trim()) {
                handleSearchVenta();
            }
        }, 600); // 600ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [invoiceSearch]);

    const fetchData = async () => {
        try {
            const [devRes, clientesRes] = await Promise.all([
                axios.get('/api/operaciones/devoluciones'),
                axios.get('/api/comercial/clientes')
            ]);
            // Fix: Handle pagination
            setDevoluciones(devRes.data.data || devRes.data);
            setClientes(clientesRes.data.data || clientesRes.data);
        } catch (error) {
            toast.error('Error al cargar devoluciones');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            tipo: 'venta',
            venta_id: '',
            fecha_devolucion: new Date().toISOString().split('T')[0],
            motivo: '',
            observaciones: '',
            detalles: []
        });
        setInvoiceSearch('');
        setSearchResults([]);
        setShowResults(false);
        setErrors({});
        setModalOpen(true);
    };

    // 1. Search for matches (Autocomplete)
    const handleSearchVenta = async () => {
        if (!invoiceSearch.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setSearchingInvoice(true);
        try {
            const res = await axios.get(`/api/operaciones/ventas/buscar?numero=${invoiceSearch}`);
            setSearchResults(res.data);
            setShowResults(true);
        } catch (error) {
            setSearchResults([]);
        } finally {
            setSearchingInvoice(false);
        }
    };

    // 2. Select invoice and load full details
    const handleSelectVenta = async (ventaId) => {
        setSearchingInvoice(true);
        setShowResults(false); // Hide dropdown
        try {
            const res = await axios.get(`/api/operaciones/ventas/buscar?id=${ventaId}`);
            const venta = res.data;

            const detalles = venta.detalles.map(det => ({
                producto_id: det.producto_id,
                producto_nombre: det.producto_nombre,
                cantidad_original: det.cantidad_original,
                cantidad_devuelta_previa: det.cantidad_devuelta,
                cantidad_disponible: det.cantidad_disponible,
                cantidad_devolver: 0,
                precio_unitario: det.precio_unitario
            }));

            setFormData(prev => ({
                ...prev,
                venta_id: venta.id,
                cliente_nombre: venta.cliente?.razon_social,
                detalles
            }));

            // Update search box to show selected value
            setInvoiceSearch(venta.numero_comprobante);

        } catch (error) {
            toast.error('Error al cargar detalles de la venta');
        } finally {
            setSearchingInvoice(false);
        }
    };

    const updateDetalle = (index, cantidad) => {
        const newDetalles = [...formData.detalles];
        // Enforce max available
        const max = newDetalles[index].cantidad_disponible;

        if (cantidad > max) {
            toast.error(`Solo puede devolver hasta ${max} unidades`);
            cantidad = max;
        }

        newDetalles[index].cantidad_devolver = cantidad;
        setFormData({ ...formData, detalles: newDetalles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.venta_id) {
            toast.error('Seleccione el documento original (Venta/Compra)');
            return;
        }

        const detallesValidos = formData.detalles.filter(d => d.cantidad_devolver > 0);
        if (detallesValidos.length === 0) {
            toast.error('Debe seleccionar al menos un producto para devolver');
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            // Transform field names to match backend expectations
            const detallesParaBackend = detallesValidos.map(det => ({
                producto_id: det.producto_id,
                cantidad: det.cantidad_devolver // Backend expects 'cantidad', not 'cantidad_devolver'
            }));

            await axios.post('/api/operaciones/devoluciones', {
                venta_id: formData.venta_id,
                motivo: formData.motivo,
                observaciones: formData.observaciones,
                detalles: detallesParaBackend
            });
            toast.success('Devolución registrada correctamente');
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al registrar devolución');
        } finally {
            setSaving(false);
        }
    };

    const calcularTotal = () => {
        return formData.detalles.reduce((sum, det) => {
            return sum + (det.cantidad_devolver * det.precio_unitario);
        }, 0);
    };

    const filteredDevoluciones = Array.isArray(devoluciones) ? devoluciones.filter(d => {
        // Access nested customer data
        const clienteNombre = d.venta?.cliente?.razon_social || 'Consumidor Final';
        const numeroDev = d.id.toString(); // We don't have numero_devolucion yet, use ID

        const matchesSearch = numeroDev.includes(searchTerm) ||
            clienteNombre.toLowerCase().includes(searchTerm.toLowerCase());

        // Assuming 'tipo' filter is relevant? If not, remove it. 
        // For now, let's assume 'all' is default and effectively disable it if 'tipo' field is missing.
        const matchesTipo = filterTipo === 'all' || d.es_cambio_producto === (filterTipo === 'cambio');

        return matchesSearch && matchesTipo;
    }) : [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Devoluciones" />

            <PageHeader
                title="Devoluciones de Ventas y Compras"
                breadcrumbs={[
                    { label: 'Operaciones', href: route('dashboard') },
                    { label: 'Devoluciones' }
                ]}
                actions={
                    <Button onClick={handleOpenModal}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Devolución
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar devolución..."
                        className="flex-1"
                    />
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="venta">Devoluciones de Venta</option>
                        <option value="compra">Devoluciones de Compra</option>
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredDevoluciones.length === 0 ? (
                    <EmptyState
                        icon={ArrowUturnLeftIcon}
                        title="No hay devoluciones"
                        description="Comienza registrando tu primera devolución"
                        action={
                            <Button onClick={handleOpenModal}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Devolución
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Cliente/Proveedor</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Motivo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredDevoluciones.map((devolucion) => (
                                    <tr key={devolucion.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                            #{devolucion.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {new Date(devolucion.fecha_devolucion).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="danger">
                                                VENTA
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {devolucion.venta?.cliente?.razon_social || 'Consumidor Final'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary-600">
                                            {devolucion.motivo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-danger-600">
                                            {formatCurrency(devolucion.monto_total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setSelectedDevolucion(devolucion);
                                                    setDetailModalOpen(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-900"
                                                title="Ver Detalle"
                                            >
                                                <EyeIcon className="h-5 w-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Nueva Devolución */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nueva Devolución"
                size="full"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>Registrar Devolución</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Tipo de Devolución
                            </label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="venta">Devolución de Venta</option>
                                <option value="compra">Devolución de Compra</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Número de Factura / Doc <span className="text-danger-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={invoiceSearch}
                                    onChange={(e) => {
                                        setInvoiceSearch(e.target.value);
                                        // Clear selection if user types again
                                        if (formData.venta_id) {
                                            setFormData(prev => ({ ...prev, venta_id: '', detalles: [] }));
                                        }
                                    }}
                                    placeholder="Buscar factura (Ej: V-2023...)"
                                    className="block w-full rounded-lg border-secondary-300 pl-10 focus:border-primary-500 focus:ring-primary-500"
                                    autoFocus
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    {searchingInvoice ? (
                                        <LoadingSpinner className="h-5 w-5 text-primary-500" />
                                    ) : (
                                        <div className="h-5 w-5 text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Autocomplete Dropdown */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-secondary-200 max-h-60 overflow-auto">
                                        <ul className="py-1">
                                            {searchResults.map((result) => (
                                                <li
                                                    key={result.id}
                                                    onClick={() => handleSelectVenta(result.id)}
                                                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm text-secondary-700 hover:text-primary-700 transition-colors"
                                                >
                                                    <span className="font-medium">{result.numero}</span>
                                                    <span className="mx-2 text-secondary-400">|</span>
                                                    <span>{result.cliente}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {formData.venta_id && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Documento validado {formData.cliente_nombre ? `(${formData.cliente_nombre})` : ''}
                                </p>
                            )}
                        </div>
                        <Input
                            label="Fecha de Devolución"
                            type="date"
                            required
                            value={formData.fecha_devolucion}
                            onChange={(e) => setFormData({ ...formData, fecha_devolucion: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                            Motivo de Devolución <span className="text-danger-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.motivo}
                            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                            className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">Seleccione motivo</option>
                            {motivos.map(motivo => (
                                <option key={motivo} value={motivo}>{motivo}</option>
                            ))}
                        </select>
                    </div>

                    {formData.detalles.length > 0 && (
                        <div className="border-t border-secondary-200 pt-4">
                            <h3 className="text-lg font-semibold text-secondary-900 mb-3">Productos a Devolver</h3>
                            <div className="space-y-2">
                                {formData.detalles.map((det, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-secondary-50 p-3 rounded-lg">
                                        <div className="col-span-5">
                                            <p className="text-sm font-medium text-secondary-900">{det.producto_nombre}</p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-xs text-secondary-600">Comprado</p>
                                            <p className="text-sm font-semibold">{det.cantidad_original}</p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-xs text-secondary-600">Disponible</p>
                                            <Badge variant="success">{det.cantidad_disponible}</Badge>
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max={det.cantidad_original}
                                                value={det.cantidad_devolver}
                                                onChange={(e) => updateDetalle(index, parseInt(e.target.value) || 0)}
                                                className="block w-full rounded-lg border-secondary-300 text-sm"
                                                placeholder="Cant. Devolver"
                                            />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-xs text-secondary-600">Precio Unit.</p>
                                            <p className="text-sm font-semibold">{formatCurrency(det.precio_unitario)}</p>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <p className="text-sm font-bold text-danger-600">
                                                {formatCurrency(det.cantidad_devolver * det.precio_unitario)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <div className="text-right">
                                    <p className="text-sm text-secondary-600">Total a Devolver</p>
                                    <p className="text-3xl font-bold text-danger-600">{formatCurrency(calcularTotal())}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                            placeholder="Observaciones adicionales..."
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal Detalle */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Devolución #${selectedDevolucion?.id}`}
                size="xl"
            >
                {selectedDevolucion && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-600">Fecha</p>
                                <p className="font-semibold">{new Date(selectedDevolucion.fecha_devolucion).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-600">Motivo</p>
                                <p className="font-semibold">{selectedDevolucion.motivo}</p>
                            </div>
                        </div>
                        <div className="border-t border-secondary-200 pt-4">
                            <h4 className="font-semibold mb-2">Productos Devueltos</h4>
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
                                    {selectedDevolucion.detalles?.map((det, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="px-4 py-2">{det.producto?.nombre}</td>
                                            <td className="px-4 py-2 text-right">{det.cantidad}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(det.precio_unitario || 0)}</td>
                                            <td className="px-4 py-2 text-right font-semibold">
                                                {formatCurrency((det.cantidad * (det.precio_unitario || 0)) || det.subtotal || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end border-t pt-4">
                            <div className="text-right">
                                <p className="text-secondary-600">Total Devuelto</p>
                                <p className="text-2xl font-bold text-danger-600">
                                    {formatCurrency(selectedDevolucion.monto_total)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
