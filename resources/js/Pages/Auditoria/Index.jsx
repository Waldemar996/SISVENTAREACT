import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ auth }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/auditoria');
            setLogs(res.data.data || res.data); // Pagination support check
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Auditoría del Sistema</h2>}>
            <Head title="Auditoría" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-md font-bold text-gray-700">Registro de Actividades</h3>
                        <button onClick={fetchLogs} className="text-sm text-blue-600 hover:text-blue-800">Refrescar</button>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Cargando trazas...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Módulo</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Acción</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Detalle</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(log.fecha).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{log.usuario?.name || 'Sistema'}</td>
                                            <td className="px-4 py-3 text-gray-600">{log.modulo}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${log.accion?.includes('CREAR') ? 'bg-green-100 text-green-800' :
                                                        log.accion?.includes('ELIMINAR') ? 'bg-red-100 text-red-800' :
                                                            log.accion?.includes('EDITAR') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {log.accion}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 truncate max-w-xs" title={JSON.stringify(log.datos_nuevos)}>
                                                {log.tabla_afectada} #{log.registro_id}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">{log.ip_usuario}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No hay registros de auditoría recientes.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
