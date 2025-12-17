import React, { useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout.jsx';
import { Head } from '@inertiajs/react';
import PermissionMatrix from '../components/PermissionMatrix.jsx';
import Button from '../../../shared/ui/Button.jsx';

export default function RolesPage({ auth }) {
    // Mock Data
    const allPermissions = [
        { name: 'sales.create' }, { name: 'sales.void' }, { name: 'sales.view_reports' },
        { name: 'inventory.adjust' }, { name: 'inventory.view' },
        { name: 'users.manage' }, { name: 'users.roles' }
    ];

    const [roles, setRoles] = useState([
        { id: 1, name: 'Admin', permissions: ['sales.create', 'sales.void', 'inventory.adjust', 'users.manage'] },
        { id: 2, name: 'Cajero', permissions: ['sales.create'] },
    ]);

    const [selectedRole, setSelectedRole] = useState(roles[0]);

    const handlePermissionChange = (permName, checked) => {
        setSelectedRole(prev => {
            const newPerms = checked
                ? [...prev.permissions, permName]
                : prev.permissions.filter(p => p !== permName);
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSave = () => {
        alert(`Guardando permisos para rol ${selectedRole.name}. Auditoría: Cambio crítico de seguridad.`);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Roles y Permisos</h2>}
        >
            <Head title="Roles" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Role List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 col-span-1">
                        <h3 className="font-medium text-gray-900 mb-4">Roles</h3>
                        <ul className="space-y-2">
                            {roles.map(role => (
                                <li
                                    key={role.id}
                                    className={`p-2 rounded cursor-pointer ${selectedRole.id === role.id ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                                    onClick={() => setSelectedRole(role)}
                                >
                                    {role.name}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t">
                            <Button size="sm" variant="secondary" className="w-full">+ Nuevo Rol</Button>
                        </div>
                    </div>

                    {/* Matrix */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 col-span-3">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Permisos para: {selectedRole.name}</h3>
                            <Button onClick={handleSave}>Guardar Cambios</Button>
                        </div>

                        <PermissionMatrix
                            permissions={allPermissions}
                            rolePermissions={selectedRole.permissions}
                            onChange={handlePermissionChange}
                        />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
