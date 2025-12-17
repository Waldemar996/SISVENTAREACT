import React, { useState } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout.jsx';
import { Head } from '@inertiajs/react';
import UserTable from '../components/UserTable.jsx';
import Button from '../../../shared/ui/Button.jsx';

export default function UsersPage({ auth }) {
    // Mock Data
    const [users, setUsers] = useState([
        { id: 1, name: 'Admin User', email: 'admin@sistema.com', role: 'admin', active: true },
        { id: 2, name: 'Cajero Principal', email: 'cajero1@sistema.com', role: 'cajero', active: true },
        { id: 3, name: 'Vendedor Junior', email: 'vend1@sistema.com', role: 'vendedor', active: false },
    ]);

    const handleEdit = (user) => alert(`Edit User: ${user.name}`);
    const handleToggle = (user) => {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gestión de Usuarios</h2>}
        >
            <Head title="Usuarios" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Usuarios del Sistema</h3>
                            <Button onClick={() => alert("Create User Audit")}>Nuevo Usuario</Button>
                        </div>
                        <UserTable users={users} onEdit={handleEdit} onToggleStatus={handleToggle} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
