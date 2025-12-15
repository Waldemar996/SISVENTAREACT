import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Modal from '@/Components/UI/Modal';
import Input from '@/Components/UI/Input';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDepartamento, setEditingDepartamento] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('/api/rrhh/departamentos');
            setDepartamentos(response.data);
        } catch (error) {
            toast.error('Error al cargar departamentos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (departamento = null) => {
        if (departamento) {
            setEditingDepartamento(departamento);
            setFormData({
                nombre: departamento.nombre,
                descripcion: departamento.descripcion || ''
            });
        } else {
            setEditingDepartamento(null);
            setFormData({ nombre: '', descripcion: '' });
        }
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (editingDepartamento) {
                await axios.put(`/api/rrhh/departamentos/${editingDepartamento.id}`, formData);
                toast.success('Departamento actualizado');
            } else {
                await axios.post('/api/rrhh/departamentos', formData);
                toast.success('Departamento creado');
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
        if (!confirm('¿Inactivar este departamento?')) return;

        try {
            await axios.delete(`/api/rrhh/departamentos/${id}`);
            toast.success('Departamento eliminado');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredDepartamentos = departamentos.filter(dept =>
        dept.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Departamentos - RRHH" />

            <PageHeader
                title="Departamentos"
                breadcrumbs={[
                    { label: 'RRHH', href: route('rrhh.empleados') },
                    { label: 'Departamentos' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Departamento
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar departamento..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredDepartamentos.length === 0 ? (
                    <EmptyState
                        icon={BuildingOfficeIcon}
                        title="No hay departamentos"
                        description="Comienza creando tu primer departamento"
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Departamento
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDepartamentos.map((dept) => (
                            <Card key={dept.id} padding="default" className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">{dept.nombre}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{dept.descripcion || 'Sin descripción'}</p>
                                        <p className="mt-2 text-xs text-slate-400">
                                            {dept.puestos_count || 0} puesto(s)
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(dept)}
                                            className="text-primary-600 hover:text-primary-900"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dept.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingDepartamento ? 'Guardar' : 'Crear'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre del Departamento"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        error={errors.nombre?.[0]}
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
