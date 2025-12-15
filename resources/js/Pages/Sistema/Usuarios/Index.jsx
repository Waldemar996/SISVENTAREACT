import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    PlusIcon, PencilIcon, TrashIcon, KeyIcon, UserIcon,
    ShieldCheckIcon, LockClosedIcon, EyeIcon, EyeSlashIcon
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
    const [usuarios, setUsuarios] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState('all');
    const [filterEstado, setFilterEstado] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        empleado_id: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        rol: 'vendedor',
        activo: true
    });

    const [passwordData, setPasswordData] = useState({
        password: '',
        password_confirmation: ''
    });

    const [errors, setErrors] = useState({});

    const roles = [
        { value: 'superadmin', label: 'Super Administrador', color: 'danger' },
        { value: 'admin', label: 'Administrador', color: 'primary' },
        { value: 'contador', label: 'Contador', color: 'info' },
        { value: 'vendedor', label: 'Vendedor', color: 'success' },
        { value: 'cajero', label: 'Cajero', color: 'warning' },
        { value: 'bodeguero', label: 'Bodeguero', color: 'secondary' },
    ];

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [usuariosRes, empleadosRes] = await Promise.all([
                axios.get('/api/usuarios'),
                axios.get('/api/rrhh/empleados')
            ]);
            setUsuarios(usuariosRes.data);
            setEmpleados(empleadosRes.data);
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (usuario = null) => {
        if (usuario) {
            setEditingUsuario(usuario);
            setFormData({
                empleado_id: usuario.empleado_id || '',
                username: usuario.username,
                email: usuario.email,
                password: '',
                password_confirmation: '',
                rol: usuario.rol,
                activo: usuario.activo
            });
        } else {
            setEditingUsuario(null);
            setFormData({
                empleado_id: '',
                username: '',
                email: '',
                password: '',
                password_confirmation: '',
                rol: 'vendedor',
                activo: true
            });
        }
        setErrors({});
        setShowPassword(false);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            if (editingUsuario) {
                await axios.put(`/api/usuarios/${editingUsuario.id}`, formData);
                toast.success('Usuario actualizado correctamente');
            } else {
                await axios.post('/api/usuarios', formData);
                toast.success('Usuario creado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            await axios.delete(`/api/usuarios/${id}`);
            toast.success('Usuario eliminado correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    const handleToggleEstado = async (usuario) => {
        try {
            await axios.patch(`/api/usuarios/${usuario.id}/toggle-estado`);
            toast.success(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente`);
            fetchData();
        } catch (error) {
            toast.error('Error al cambiar estado del usuario');
        }
    };

    const handleOpenPasswordModal = (usuario) => {
        setSelectedUsuario(usuario);
        setPasswordData({
            password: '',
            password_confirmation: ''
        });
        setErrors({});
        setShowPassword(false);
        setPasswordModalOpen(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await axios.post(`/api/usuarios/${selectedUsuario.id}/cambiar-password`, passwordData);
            toast.success('Contraseña actualizada correctamente');
            setPasswordModalOpen(false);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error('Error al cambiar contraseña');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsuarios = usuarios.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.empleado?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRol = filterRol === 'all' || u.rol === filterRol;
        const matchesEstado = filterEstado === 'all' ||
            (filterEstado === 'activo' && u.activo) ||
            (filterEstado === 'inactivo' && !u.activo);
        return matchesSearch && matchesRol && matchesEstado;
    });

    const getRolBadge = (rol) => {
        const roleConfig = roles.find(r => r.value === rol);
        return (
            <Badge variant={roleConfig?.color || 'default'}>
                {roleConfig?.label || rol.toUpperCase()}
            </Badge>
        );
    };

    const getEmpleadosDisponibles = () => {
        const empleadosConUsuario = usuarios.map(u => u.empleado_id);
        return empleados.filter(emp => !empleadosConUsuario.includes(emp.id) || emp.id === editingUsuario?.empleado_id);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Usuarios del Sistema" />

            <PageHeader
                title="Gestión de Usuarios"
                breadcrumbs={[
                    { label: 'Sistema', href: route('dashboard') },
                    { label: 'Usuarios' }
                ]}
                actions={
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nuevo Usuario
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por usuario, email o nombre..."
                        className="flex-1"
                    />
                    <div className="flex gap-2">
                        <select
                            value={filterRol}
                            onChange={(e) => setFilterRol(e.target.value)}
                            className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        >
                            <option value="all">Todos los roles</option>
                            {roles.map(rol => (
                                <option key={rol.value} value={rol.value}>{rol.label}</option>
                            ))}
                        </select>
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredUsuarios.length === 0 ? (
                    <EmptyState
                        icon={UserIcon}
                        title="No hay usuarios"
                        description={searchTerm || filterRol !== 'all' || filterEstado !== 'all'
                            ? 'No se encontraron usuarios con esos filtros'
                            : 'Comienza creando tu primer usuario del sistema'}
                        action={
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Crear Usuario
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Empleado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Último Acceso</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="h-5 w-5 text-primary-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-secondary-900">{usuario.username}</div>
                                                    <div className="text-xs text-secondary-500">ID: {usuario.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                            {usuario.empleado?.nombre_completo || (
                                                <span className="text-secondary-400 italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                            {usuario.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRolBadge(usuario.rol)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={usuario.activo ? 'success' : 'danger'}>
                                                {usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                            {usuario.ultimo_acceso || 'Nunca'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(usuario)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Editar"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenPasswordModal(usuario)}
                                                    className="text-warning-600 hover:text-warning-900"
                                                    title="Cambiar Contraseña"
                                                >
                                                    <KeyIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleEstado(usuario)}
                                                    className={`${usuario.activo ? 'text-warning-600 hover:text-warning-900' : 'text-success-600 hover:text-success-900'}`}
                                                    title={usuario.activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    {usuario.activo ? (
                                                        <LockClosedIcon className="h-5 w-5" />
                                                    ) : (
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(usuario.id)}
                                                    className="text-danger-600 hover:text-danger-900"
                                                    title="Eliminar"
                                                    disabled={usuario.id === auth.user.id}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Crear/Editar Usuario */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                size="xl"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} loading={saving}>
                            {editingUsuario ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información del Empleado */}
                    <div className="border-b border-secondary-200 pb-4">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información del Empleado</h3>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                Empleado <span className="text-danger-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.empleado_id}
                                onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">Seleccione un empleado</option>
                                {getEmpleadosDisponibles().map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nombre_completo} - {emp.codigo_empleado}
                                    </option>
                                ))}
                            </select>
                            {errors.empleado_id && <p className="mt-1 text-sm text-danger-600">{errors.empleado_id[0]}</p>}
                        </div>
                    </div>

                    {/* Credenciales de Acceso */}
                    <div className="border-b border-secondary-200 pb-4">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Credenciales de Acceso</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nombre de Usuario"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                error={errors.username?.[0]}
                                placeholder="usuario123"
                            />
                            <Input
                                label="Email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email?.[0]}
                                placeholder="usuario@empresa.com"
                            />
                        </div>

                        {!editingUsuario && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                        Contraseña <span className="text-danger-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-secondary-400" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-danger-600">{errors.password[0]}</p>}
                                </div>
                                <Input
                                    label="Confirmar Contraseña"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    error={errors.password_confirmation?.[0]}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}
                    </div>

                    {/* Rol y Permisos */}
                    <div>
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Rol y Permisos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                    Rol del Usuario <span className="text-danger-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.rol}
                                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                    className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    {roles.map(rol => (
                                        <option key={rol.value} value={rol.value}>{rol.label}</option>
                                    ))}
                                </select>
                                {errors.rol && <p className="mt-1 text-sm text-danger-600">{errors.rol[0]}</p>}
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
                                    Usuario Activo
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal Cambiar Contraseña */}
            <Modal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                title={`Cambiar Contraseña - ${selectedUsuario?.username}`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleChangePassword} loading={saving}>Cambiar Contraseña</Button>
                    </>
                }
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                            Nueva Contraseña <span className="text-danger-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={passwordData.password}
                                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                className="block w-full rounded-lg border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-secondary-400" />
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-danger-600">{errors.password[0]}</p>}
                    </div>
                    <Input
                        label="Confirmar Nueva Contraseña"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordData.password_confirmation}
                        onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                        error={errors.password_confirmation?.[0]}
                        placeholder="••••••••"
                    />
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                        <p className="text-sm text-warning-800">
                            <strong>Importante:</strong> El usuario deberá usar esta nueva contraseña en su próximo inicio de sesión.
                        </p>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
