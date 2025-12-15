import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

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
    const [puestos, setPuestos] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPuesto, setEditingPuesto] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre_puesto: '',
        departamento_id: '',
        salario_base: '',
        descripcion: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [puestosRes, deptosRes] = await Promise.all([
                axios.get('/api/rrhh/puestos'),
                axios.get('/api/rrhh/departamentos')
            ]);
            setPuestos(puestosRes.data);
            setDepartamentos(deptosRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (puesto = null) => {
        if (puesto) {
            setEditingPuesto(puesto);
            setFormData({
                nombre_puesto: puesto.nombre_puesto,
                departamento_id: puesto.departamento_id || '',
                salario_base: puesto.salario_base || '',
                descripcion: puesto.descripcion || ''
            });
        } else {
            setEditingPuesto(null);
            setFormData({
                nombre_puesto: '',
                departamento_id: '',
                salario_base: '',
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
            if (editingPuesto) {
                await axios.put(`/api/rrhh/puestos/${editingPuesto.id}`, formData);
                toast.success('Puesto actualizado');
            } else {
                await axios.post('/api/rrhh/puestos', formData);
                toast.success('Puesto creado');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este puesto?')) return;

        try {
            await axios.delete(`/api/rrhh/puestos/${id}`);
            toast.success('Puesto eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredPuestos = puestos.filter(puesto =>
        puesto.nombre_puesto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Puestos - RRHH" />

            <PageHeader
                title="Puestos de Trabajo"
                breadcrumbs={[
                    { label: 'RRHH', href: route('rrhh.empleados') },
                    { label: 'Puestos' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Puesto
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar puesto..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredPuestos.length === 0 ? (
                    <EmptyState
                        icon={BriefcaseIcon}
                        title="No hay puestos"
                        description="Comienza creando tu primer puesto de trabajo"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Puesto
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Puesto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Departamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Salario Base</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Empleados</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredPuestos.map((puesto) => (
                                    <tr key={puesto.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{puesto.nombre_puesto}</div>
                                            {puesto.descripcion && (
                                                <div className="text-xs text-slate-500">{puesto.descripcion}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="primary">
                                                {puesto.departamento?.nombre || 'Sin Departamento'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {formatCurrency(puesto.salario_base)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {puesto.empleados_count || 0} empleado(s)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(puesto)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(puesto.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5 inline" />
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
                title={editingPuesto ? 'Editar Puesto' : 'Nuevo Puesto'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingPuesto ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre del Puesto"
                        required
                        value={formData.nombre_puesto}
                        onChange={(e) => setFormData({ ...formData, nombre_puesto: e.target.value })}
                        error={errors.nombre_puesto?.[0]}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Departamento <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.departamento_id}
                            onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">Seleccione Departamento</option>
                            {departamentos.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                            ))}
                        </select>
                        {errors.departamento_id && <p className="mt-1.5 text-sm text-red-600">{errors.departamento_id[0]}</p>}
                    </div>

                    <Input
                        label="Salario Base"
                        type="number"
                        step="0.01"
                        value={formData.salario_base}
                        onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                        error={errors.salario_base?.[0]}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={3}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
