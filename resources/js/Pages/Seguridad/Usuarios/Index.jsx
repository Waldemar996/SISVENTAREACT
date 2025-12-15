import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ auth }) {
    const [usuarios, setUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingNode, setEditingNode] = useState(null);

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        rol: 'vendedor',
        activo: true
    });

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        const res = await axios.get('/api/seguridad/usuarios');
        setUsuarios(res.data);
    };

    const handleEdit = (u) => {
        setEditingNode(u);
        setForm({
            username: u.username,
            email: u.email,
            password: '', // Empty for security
            rol: u.rol,
            activo: u.activo
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Desactivar este usuario? Podrá reactivarlo después.')) return;
        try {
            await axios.delete(`/api/seguridad/usuarios/${id}`);
            fetchUsuarios();
        } catch (error) {
            alert("Error: " + (error.response?.data?.message || "Falló eliminación"));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingNode) {
                await axios.put(`/api/seguridad/usuarios/${editingNode.id}`, form);
                alert("Usuario Actualizado");
            } else {
                await axios.post('/api/seguridad/usuarios', form);
                alert("Usuario Creado");
            }
            setShowModal(false);
            setEditingNode(null);
            setForm({ username: '', email: '', password: '', rol: 'vendedor', activo: true });
            fetchUsuarios();
        } catch (error) {
            alert("Error: " + (error.response?.data?.message || "Falló operación"));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Gestión de Usuarios (V9)</h2>}>
            <Head title="Usuarios" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700">Usuarios del Sistema</h3>
                        <p className="text-sm text-gray-500">Administra accesos y roles (Enterprise).</p>
                    </div>
                    <button onClick={() => { setEditingNode(null); setForm({ username: '', email: '', password: '', rol: 'vendedor', activo: true }); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow">
                        + Nuevo Usuario
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {usuarios.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${u.rol === 'superadmin' ? 'bg-red-100 text-red-800' :
                                                u.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    u.rol === 'vendedor' ? 'bg-green-100 text-green-800' :
                                                        u.rol === 'bodeguero' ? 'bg-yellow-100 text-yellow-800' :
                                                            u.rol === 'rrhh' ? 'bg-pink-100 text-pink-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                            {u.rol.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {u.activo ? (
                                            <span className="text-green-600 font-bold text-xs">ACTIVO</span>
                                        ) : (
                                            <span className="text-red-600 font-bold text-xs">INACTIVO</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                        <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900">Desactivar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{editingNode ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input type="text" className="w-full border rounded mt-1" required
                                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" className="w-full border rounded mt-1" required
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password {editingNode && <span className="text-xs text-gray-500">(Dejar en blanco para no cambiar)</span>}
                                </label>
                                <input type="password" className="w-full border rounded mt-1"
                                    required={!editingNode}
                                    minLength="6"
                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Rol</label>
                                <select className="w-full border rounded mt-1" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                                    <option value="superadmin">SUPERADMIN</option>
                                    <option value="admin">ADMIN</option>
                                    <option value="vendedor">VENDEDOR</option>
                                    <option value="bodeguero">BODEGUERO</option>
                                    <option value="contador">CONTADOR</option>
                                    <option value="rrhh">RRHH</option>
                                </select>
                            </div>

                            {editingNode && (
                                <div className="mb-4 flex items-center">
                                    <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="mr-2" />
                                    <label htmlFor="activo" className="text-sm text-gray-700">Usuario Activo</label>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
