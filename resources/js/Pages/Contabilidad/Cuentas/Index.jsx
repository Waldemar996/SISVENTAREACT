import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon,
    ChevronDownIcon, FolderIcon, DocumentTextIcon
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
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCuenta, setEditingCuenta] = useState(null);
    const [saving, setSaving] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        tipo: 'activo',
        nivel: 1,
        cuenta_padre_id: null,
        acepta_movimiento: true,
        descripcion: ''
    });

    const [errors, setErrors] = useState({});

    const tipos = [
        { value: 'activo', label: 'Activo', color: 'success' },
        { value: 'pasivo', label: 'Pasivo', color: 'danger' },
        { value: 'patrimonio', label: 'Patrimonio', color: 'info' },
        { value: 'ingreso', label: 'Ingreso', color: 'primary' },
        { value: 'gasto', label: 'Gasto', color: 'warning' },
        { value: 'orden', label: 'Orden', color: 'secondary' }
    ];

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/contabilidad/cuentas');
            setCuentas(response.data);
        } catch (error) {
            toast.error('Error al cargar catálogo de cuentas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cuenta = null, parentId = null) => {
        if (cuenta) {
            setEditingCuenta(cuenta);
            setFormData({
                codigo: cuenta.codigo,
                nombre: cuenta.nombre,
                tipo: cuenta.tipo,
                nivel: cuenta.nivel,
                cuenta_padre_id: cuenta.cuenta_padre_id,
                acepta_movimiento: cuenta.acepta_movimiento,
                descripcion: cuenta.descripcion || ''
            });
        } else {
            setEditingCuenta(null);
            const parentCuenta = parentId ? cuentas.find(c => c.id === parentId) : null;
            setFormData({
                codigo: '',
                nombre: '',
                tipo: parentCuenta?.tipo || 'activo',
                nivel: parentCuenta ? parentCuenta.nivel + 1 : 1,
                cuenta_padre_id: parentId,
                acepta_movimiento: true,
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
            if (editingCuenta) {
                await axios.put(`/api/contabilidad/cuentas/${editingCuenta.id}`, formData);
                toast.success('Cuenta actualizada correctamente');
            } else {
                await axios.post('/api/contabilidad/cuentas', formData);
                toast.success('Cuenta creada correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar cuenta');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Inactivar esta cuenta? Se marcarán también las subcuentas como inactivas.')) return;

        try {
            await axios.delete(`/api/contabilidad/cuentas/${id}`);
            toast.success('Cuenta eliminada correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al inactivar cuenta');
        }
    };

    const toggleNode = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const buildTree = (cuentas, parentId = null) => {
        return cuentas
            .filter(c => c.cuenta_padre_id === parentId)
            .sort((a, b) => a.codigo.localeCompare(b.codigo));
    };

    const filteredCuentas = cuentas.filter(c => {
        const matchesSearch = c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = filterTipo === 'all' || c.tipo === filterTipo;
        return matchesSearch && matchesTipo;
    });

    const getTipoBadge = (tipo) => {
        const tipoConfig = tipos.find(t => t.value === tipo);
        return <Badge variant={tipoConfig?.color}>{tipoConfig?.label}</Badge>;
    };

    const renderTreeNode = (cuenta, level = 0) => {
        const children = buildTree(cuentas, cuenta.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedNodes.has(cuenta.id);

        return (
            <div key={cuenta.id}>
                <div
                    className={`flex items-center justify-between p-3 hover:bg-secondary-50 border-b border-secondary-100 transition-colors ${level > 0 ? 'ml-' + (level * 6) : ''
                        }`}
                    style={{ paddingLeft: `${level * 24 + 12}px` }}
                >
                    <div className="flex items-center gap-3 flex-1">
                        {hasChildren ? (
                            <button
                                onClick={() => toggleNode(cuenta.id)}
                                className="p-1 hover:bg-secondary-200 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4 text-secondary-600" />
                                ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-secondary-600" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}

                        {hasChildren ? (
                            <FolderIcon className="h-5 w-5 text-warning-500" />
                        ) : (
                            <DocumentTextIcon className="h-5 w-5 text-primary-500" />
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-semibold text-secondary-900">
                                    {cuenta.codigo}
                                </span>
                                <span className="text-sm text-secondary-900">{cuenta.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {getTipoBadge(cuenta.tipo)}
                                <Badge variant={cuenta.acepta_movimiento ? 'success' : 'secondary'} size="sm">
                                    {cuenta.acepta_movimiento ? 'Movimiento' : 'Agrupadora'}
                                </Badge>
                                <span className="text-xs text-secondary-500">Nivel {cuenta.nivel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenModal(null, cuenta.id)}
                            className="p-2 text-success-600 hover:bg-success-50 rounded"
                            title="Agregar Subcuenta"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleOpenModal(cuenta)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                            title="Editar"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(cuenta.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded"
                            title="Inactivar"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {children.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const rootCuentas = buildTree(filteredCuentas, null);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Catálogo de Cuentas" />

            <PageHeader
                title="Catálogo de Cuentas Contables"
                breadcrumbs={[
                    { label: 'Contabilidad', href: route('dashboard') },
                    { label: 'Catálogo de Cuentas' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nueva Cuenta
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por código o nombre..."
                        className="flex-1"
                    />
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                        <option value="all">Todos los tipos</option>
                        {tipos.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                    </select>
                    <Button
                        variant="secondary"
                        onClick={() => setExpandedNodes(new Set(cuentas.map(c => c.id)))}
                    >
                        Expandir Todo
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setExpandedNodes(new Set())}
                    >
                        Colapsar Todo
                    </Button>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : rootCuentas.length === 0 ? (
                    <EmptyState
                        icon={FolderIcon}
                        title="No hay cuentas"
                        description="Comienza creando tu catálogo de cuentas contables"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Cuenta
                            </Button>
                        }
                    />
                ) : (
                    <div className="border border-secondary-200 rounded-lg overflow-hidden">
                        {rootCuentas.map(cuenta => renderTreeNode(cuenta))}
                    </div>
                )}
            </Card>

            {/* Modal Crear/Editar Cuenta */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingCuenta ? 'Guardar Cambios' : 'Crear Cuenta'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Código"
                            required
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            error={errors.codigo?.[0]}
                            placeholder="1.1.01"
                        />
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Tipo de Cuenta <span className="text-danger-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                {tipos.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Nombre de la Cuenta"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        error={errors.nombre?.[0]}
                        placeholder="Caja General"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nivel"
                            type="number"
                            required
                            value={formData.nivel}
                            onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                            error={errors.nivel?.[0]}
                            min="1"
                            max="5"
                        />
                        <div className="flex items-center pt-6">
                            <input
                                type="checkbox"
                                id="acepta_movimiento"
                                checked={formData.acepta_movimiento}
                                onChange={(e) => setFormData({ ...formData, acepta_movimiento: e.target.checked })}
                                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                            />
                            <label htmlFor="acepta_movimiento" className="ml-2 text-sm font-medium text-secondary-700">
                                Acepta Movimiento
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-secondary-300"
                            placeholder="Descripción opcional de la cuenta..."
                        />
                    </div>

                    {formData.cuenta_padre_id && (
                        <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                            <p className="text-sm text-info-800">
                                <strong>Nota:</strong> Esta cuenta será una subcuenta de la cuenta padre seleccionada.
                            </p>
                        </div>
                    )}
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
