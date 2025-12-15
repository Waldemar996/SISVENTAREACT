import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlusIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';

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
    const [empleados, setEmpleados] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmpleado, setEditingEmpleado] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        codigo_empleado: '',
        email_personal: '',
        telefono: '',
        puesto_id: '',
        fecha_contratacion: new Date().toISOString().split('T')[0],
        estado: 'activo'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, puesRes] = await Promise.all([
                axios.get('/api/rrhh/empleados'),
                axios.get('/api/rrhh/puestos')
            ]);
            setEmpleados(empRes.data);
            setPuestos(puesRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (empleado = null) => {
        if (empleado) {
            setEditingEmpleado(empleado);
            setFormData({
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                codigo_empleado: empleado.codigo_empleado || '',
                email_personal: empleado.email_personal || '',
                telefono: empleado.telefono || '',
                puesto_id: empleado.puesto_id || '',
                fecha_contratacion: empleado.fecha_contratacion || '',
                estado: empleado.estado
            });
        } else {
            setEditingEmpleado(null);
            setFormData({
                nombres: '',
                apellidos: '',
                codigo_empleado: '',
                email_personal: '',
                telefono: '',
                puesto_id: '',
                fecha_contratacion: new Date().toISOString().split('T')[0],
                estado: 'activo'
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
            if (editingEmpleado) {
                await axios.put(`/api/rrhh/empleados/${editingEmpleado.id}`, formData);
                toast.success('Empleado actualizado correctamente');
            } else {
                await axios.post('/api/rrhh/empleados', formData);
                toast.success('Empleado registrado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al guardar el empleado');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este empleado?')) return;

        try {
            await axios.delete(`/api/rrhh/empleados/${id}`);
            toast.success('Empleado eliminado correctamente');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar empleado');
        }
    };

    const filteredEmpleados = empleados.filter(emp =>
        emp.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.codigo_empleado && emp.codigo_empleado.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getEstadoBadge = (estado) => {
        const variants = {
            activo: 'success',
            baja: 'danger',
            suspension: 'warning'
        };
        return <Badge variant={variants[estado]}>{estado.toUpperCase()}</Badge>;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Empleados - RRHH" />

            <PageHeader
                title="Gestión de Empleados"
                breadcrumbs={[
                    { label: 'RRHH', href: route('rrhh.empleados') },
                    { label: 'Empleados' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()} variant="primary">
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Empleado
                    </Button>
                }
            />

            <Card>
                <div className="mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, apellido o código..."
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredEmpleados.length === 0 ? (
                    <EmptyState
                        icon={UserCircleIcon}
                        title="No hay empleados"
                        description={searchTerm ? 'No se encontraron empleados con ese criterio' : 'Comienza agregando tu primer empleado'}
                        action={
                            !searchTerm && (
                                <Button onClick={() => handleOpenModal()}>
                                    <UserPlusIcon className="h-5 w-5 mr-2" />
                                    Agregar Empleado
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Código</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Nombre Completo</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Departamento</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Puesto</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Contacto</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-3 md:px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredEmpleados.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="px-3 md:px-6 py-4 text-sm font-medium text-secondary-900">
                                            {emp.codigo_empleado || 'N/A'}
                                        </td>
                                        <td className="px-3 md:px-6 py-4">
                                            <div className="text-sm font-medium text-secondary-900">{emp.nombres} {emp.apellidos}</div>
                                            <div className="text-xs text-secondary-500 whitespace-nowrap">
                                                {new Date(emp.fecha_contratacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-6 py-4 text-sm text-secondary-700">
                                            {emp.puesto?.departamento?.nombre || 'Sin Depto'}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 text-sm text-secondary-700">
                                            {emp.puesto?.nombre_puesto || 'Sin Puesto'}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 text-sm text-secondary-500 break-all">
                                            <div>{emp.email_personal || '-'}</div>
                                            <div className="whitespace-nowrap">{emp.telefono || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(emp.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(emp)}
                                                className="text-primary-600 hover:text-primary-900 mr-4 transition-colors"
                                            >
                                                <PencilIcon className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
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

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingEmpleado ? 'Guardar Cambios' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Nombres"
                            required
                            value={formData.nombres}
                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                            error={errors.nombres?.[0]}
                        />
                        <Input
                            label="Apellidos"
                            required
                            value={formData.apellidos}
                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                            error={errors.apellidos?.[0]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Código Empleado"
                            value={formData.codigo_empleado}
                            onChange={(e) => setFormData({ ...formData, codigo_empleado: e.target.value })}
                            error={errors.codigo_empleado?.[0]}
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            error={errors.telefono?.[0]}
                        />
                    </div>

                    <Input
                        label="Email Personal"
                        type="email"
                        value={formData.email_personal}
                        onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                        error={errors.email_personal?.[0]}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Puesto <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.puesto_id}
                                onChange={(e) => setFormData({ ...formData, puesto_id: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Seleccione Puesto</option>
                                {puestos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre_puesto} - {p.departamento?.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.puesto_id && <p className="mt-1.5 text-sm text-red-600">{errors.puesto_id[0]}</p>}
                        </div>

                        <Input
                            label="Fecha Contratación"
                            type="date"
                            required
                            value={formData.fecha_contratacion}
                            onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })}
                            error={errors.fecha_contratacion?.[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                        <select
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="activo">Activo</option>
                            <option value="baja">Baja</option>
                            <option value="suspension">Suspensión</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
