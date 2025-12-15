import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Manager({ auth }) {
    const [ordenes, setOrdenes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [bodegas, setBodegas] = useState([]);

    // Modal & Form (Simplified Logic)
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ producto_id: '', cantidad: '', bodega_id: '', fecha: new Date().toISOString().split('T')[0] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        const [ordRes, prodRes, bodRes] = await Promise.all([
            axios.get('/api/produccion/ordenes'),
            axios.get('/api/inventario/productos'),
            axios.get('/api/inventario/bodegas'),
        ]);
        setOrdenes(ordRes.data.data || ordRes.data);
        setProductos(prodRes.data.data || prodRes.data);
        setBodegas(bodRes.data.data || bodRes.data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/produccion/ordenes', {
                producto_terminado_id: form.producto_id,
                cantidad_planeada: form.cantidad,
                bodega_destino_id: form.bodega_id,
                fecha_inicio_programada: form.fecha
            });
            setShowModal(false);
            fetchResources();
            alert("Orden Planificada");
        } catch (error) {
            alert("Error creando orden");
        }
    };

    const handleFinalize = async (orden) => {
        const real = prompt(`Confirmar cantidad FINAL producida para orden ${orden.numero_orden}:`, orden.cantidad_planeada);
        if (real === null) return;

        setLoading(true);
        try {
            await axios.post(`/api/produccion/ordenes/${orden.id}/finalizar`, { cantidad_real: real });
            alert("✅ Producción Ejecutada: Stock actualizado y Costo Real calculado.");
            fetchResources();
        } catch (error) {
            alert("❌ Error: " + (error.response?.data?.message || "Hubo un problema."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Control de Producción</h2>}>
            <Head title="Órdenes Producción" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-700">Tablero de Órdenes</h3>
                    <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow">
                        + Nueva Orden
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega Destino</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Real</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ordenes.map((orden) => (
                                <tr key={orden.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{orden.numero_orden}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{orden.producto_terminado?.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">
                                        {orden.estado === 'finalizada' ? orden.cantidad_producida : orden.cantidad_planeada}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{orden.bodega_destino?.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${orden.estado === 'finalizada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} capitalize`}>
                                            {orden.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        {Number(orden.costo_real_total) > 0 ? `Q${Number(orden.costo_real_total).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {orden.estado !== 'finalizada' && (
                                            <button
                                                onClick={() => handleFinalize(orden)}
                                                disabled={loading}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                                            >
                                                ⚡ Ejecutar Producción
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Planificar Producción</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Producto a Fabricar</label>
                                <select className="w-full border rounded" required value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Cantidad a Producir</label>
                                <input type="number" className="w-full border rounded" required value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bodega Destino</label>
                                <select className="w-full border rounded" required value={form.bodega_id} onChange={e => setForm({ ...form, bodega_id: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
