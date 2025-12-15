import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, HashtagIcon
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
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSerie, setEditingSerie] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        tipo_documento: 'factura',
        prefijo: '',
        numero_actual: 1,
        numero_minimo: 1,
        numero_maximo: 999999,
        longitud: 6,
        activo: true,
        descripcion: ''
    });

    const [errors, setErrors] = useState({});

    const tiposDocumento = [
        { value: 'factura', label: 'Factura', color: 'primary' },
        { value: 'cotizacion', label: 'Cotización', color: 'info' },
        { value: 'compra', label: 'Compra', color: 'warning' },
        { value: 'venta', label: 'Venta', color: 'success' },
        { value: 'devolucion', label: 'Devolución', color: 'danger' },
        { value: 'traslado', label: 'Traslado', color: 'secondary' },
        { value: 'partida', label: 'Partida Contable', color: 'info' },
        { value: 'recibo', label: 'Recibo', color: 'success' }
    ];

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/configuracion/series');
            setSeries(response.data);
        } catch (error) {
            toast.error('Error al cargar series');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (serie = null) => {
        if (serie) {
            setEditingSerie(serie);
            setFormData({
                tipo_documento: serie.tipo_documento,
                prefijo: serie.prefijo,
                numero_actual: serie.numero_actual,
                numero_minimo: serie.numero_minimo,
                numero_maximo: serie.numero_maximo,
                longitud: serie.longitud,
                activo: serie.activo,
                descripcion: serie.descripcion || ''
            });
        } else {
            setEditingSerie(null);
            setFormData({
                tipo_documento: 'factura',
                prefijo: '',
                numero_actual: 1,
                numero_minimo: 1,
                numero_maximo: 999999,
                longitud: 6,
                activo: true,
                descripcion: ''
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
            if (editingSerie) {
                await axios.put(`/api/configuracion/series/${editingSerie.id}`, formData);
                toast.success('Serie actualizada correctamente');
            } else {
                await axios.post('/api/configuracion/series', formData);
                toast.success('Serie creada correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar serie');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar esta serie?')) return;

        try {
            await axios.delete(`/api/configuracion/series/${id}`);
            toast.success('Serie eliminada correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar serie');
        }
    };

    const filteredSeries = series.filter(s => {
        const matchesSearch = s.prefijo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = filterTipo === 'all' || s.tipo_documento === filterTipo;
        return matchesSearch && matchesTipo;
    });

    const getTipoDocumentoBadge = (tipo) => {
        const tipoConfig = tiposDocumento.find(t => t.value === tipo);
        return <Badge variant={tipoConfig?.color}>{tipoConfig?.label}</Badge>;
    };

    const generarEjemplo = () => {
        const numero = String(formData.numero_actual).padStart(formData.longitud, '0');
        return `${formData.prefijo}${numero}`;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Series y Correlativos" />

            <PageHeader
                title="Series y Correlativos de Documentos"
                breadcrumbs={[
                    { label: 'Configuración', href: route('dashboard') },
                    { label: 'Series' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Serie
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar serie..."
                        className="flex-1"
                    />
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los tipos</option>
                        {tiposDocumento.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredSeries.length === 0 ? (
                    <EmptyState
                        icon={HashtagIcon}
                        title="No hay series configuradas"
                        description="Comienza creando series para la numeración de tus documentos"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Serie
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Tipo Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Prefijo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Número Actual</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Rango</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Ejemplo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredSeries.map((serie) => {
                                    const ejemplo = `${serie.prefijo}${String(serie.numero_actual).padStart(serie.longitud, '0')}`;
                                    return (
                                        <tr key={serie.id} className="hover:bg-secondary-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTipoDocumentoBadge(serie.tipo_documento)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                                {serie.prefijo || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                                                {serie.numero_actual}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                                {serie.numero_minimo} - {serie.numero_maximo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary-900">
                                                {ejemplo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={serie.activo ? 'success' : 'danger'}>
                                                    {serie.activo ? 'ACTIVA' : 'INACTIVA'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleOpenModal(serie)}
                                                    className="text-primary-600 hover:text-primary-900 mr-3"
                                                    title="Editar"
                                                >
                                                    <PencilIcon className="h-5 w-5 inline" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(serie.id)}
                                                    className="text-danger-600 hover:text-danger-900"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="h-5 w-5 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Crear/Editar Serie */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingSerie ? 'Editar Serie' : 'Nueva Serie'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingSerie ? 'Guardar Cambios' : 'Crear Serie'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                            Tipo de Documento <span className="text-danger-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.tipo_documento}
                            onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                            className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            {tiposDocumento.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Prefijo"
                            value={formData.prefijo}
                            onChange={(e) => setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })}
                            error={errors.prefijo?.[0]}
                            placeholder="FAC-"
                        />
                        <Input
                            label="Longitud del Número"
                            type="number"
                            required
                            value={formData.longitud}
                            onChange={(e) => setFormData({ ...formData, longitud: parseInt(e.target.value) })}
                            error={errors.longitud?.[0]}
                            min="1"
                            max="10"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Número Actual"
                            type="number"
                            required
                            value={formData.numero_actual}
                            onChange={(e) => setFormData({ ...formData, numero_actual: parseInt(e.target.value) })}
                            error={errors.numero_actual?.[0]}
                            min="1"
                        />
                        <Input
                            label="Número Mínimo"
                            type="number"
                            required
                            value={formData.numero_minimo}
                            onChange={(e) => setFormData({ ...formData, numero_minimo: parseInt(e.target.value) })}
                            error={errors.numero_minimo?.[0]}
                            min="1"
                        />
                        <Input
                            label="Número Máximo"
                            type="number"
                            required
                            value={formData.numero_maximo}
                            onChange={(e) => setFormData({ ...formData, numero_maximo: parseInt(e.target.value) })}
                            error={errors.numero_maximo?.[0]}
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={2}
                            className="block w-full rounded-lg border-secondary-300"
                            placeholder="Descripción de la serie..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="activo"
                            checked={formData.activo}
                            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <label htmlFor="activo" className="ml-2 text-sm font-medium text-secondary-700">
                            Serie Activa
                        </label>
                    </div>

                    <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                        <p className="text-sm text-info-800 mb-2">
                            <strong>Vista Previa:</strong>
                        </p>
                        <p className="text-2xl font-mono font-bold text-primary-600">
                            {generarEjemplo()}
                        </p>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
