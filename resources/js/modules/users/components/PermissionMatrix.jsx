import React from 'react';

export default function PermissionMatrix({ permissions, rolePermissions, onChange, readOnly = false }) {
    // Group permissions by module (e.g., "sales.create" -> Module "sales")
    const grouped = permissions.reduce((acc, perm) => {
        const [module, action] = perm.name.split('.');
        if (!acc[module]) acc[module] = [];
        acc[module].push({ ...perm, action });
        return acc;
    }, {});

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium text-gray-700">Matriz de Permisos</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(grouped).map(module => (
                    <div key={module} className="bg-white border rounded shadow-sm p-3">
                        <h4 className="font-bold text-gray-800 capitalize mb-2 border-b pb-1">{module}</h4>
                        <div className="space-y-2">
                            {grouped[module].map(perm => (
                                <label key={perm.name} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={rolePermissions.includes(perm.name)}
                                        onChange={(e) => !readOnly && onChange(perm.name, e.target.checked)}
                                        disabled={readOnly}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{perm.action.replace(/_/g, ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
