import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline'; // Adding icons

export default function Manager({ auth }) {
    const [lotes, setLotes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    // Form
    const [productoId, setProductoId] = useState('');
    const [codigoLote, setCodigoLote] = useState('');
    const [fechaFab, setFechaFab] = useState('');
    const [fechaVenc, setFechaVenc] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/inventario/lotes');
            setLotes(res.data);
            const prodRes = await axios.get('/api/inventario/productos');
            setProductos(prodRes.data.data || prodRes.data);
        } catch (error) {
            toast.error('Error cargando datos');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventario/lotes', {
                producto_id: productoId,
                codigo_lote: codigoLote,
                fecha_fabricacion: fechaFab,
                fecha_vencimiento: fechaVenc
            });
            setModalOpen(false);
            fetchData();
            toast.success("Lote Registrado Correctamente");
            // Reset form
            setProductoId('');
            setCodigoLote('');
            setFechaFab('');
            setFechaVenc('');
        } catch (error) {
            toast.error("Error registrando lote");
            console.error(error);
        }
    };

    const getDaysToExpiration = (dateStr) => {
        const today = new Date();
        const exp = new Date(dateStr);
        const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Gestión de Lotes y Vencimientos</h2>}>
            <Head title="Lotes" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="bg-white p-4 rounded shadow flex-1">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TagIcon className="h-5 w-5 text-gray-600" />
                            Semáforo de Vencimientos
                        </h3>
                        <div className="flex gap-4 mt-2 text-sm">
                            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Vencido</span>
                            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div> &lt; 30 días</span>
                            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div> OK</span>
                        </div>
                    </div>
                    <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 self-center flex items-center gap-2">
                        <PlusIcon className="h-5 w-5" />
                        Registrar Nuevo Lote
                    </button>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Lote</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabricación</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lotes.map((lote) => {
                                    const days = getDaysToExpiration(lote.fecha_vencimiento);
                                    let statusColor = "bg-green-100 text-green-800";
                                    let statusText = "OK";
                                    if (days < 0) { statusColor = "bg-red-100 text-red-800"; statusText = "VENCIDO"; }
                                    else if (days < 30) { statusColor = "bg-yellow-100 text-yellow-800"; statusText = "Por Vencer"; }

                                    return (
                                        <tr key={lote.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{lote.codigo_lote}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lote.producto?.nombre}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lote.fecha_fabricacion}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                {lote.fecha_vencimiento}
                                                <div className="text-xs font-normal text-gray-400">({days} días)</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {lotes.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No hay lotes registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL */}
                {modalOpen && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 text-center">
                            <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
                            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6 relative z-20 text-left">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Lote de Producción / Compra</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Producto</label>
                                        <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required onChange={e => setProductoId(e.target.value)} value={productoId}>
                                            <option value="">Seleccione...</option>
                                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Código de Lote (Impreso en caja)</label>
                                        <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required value={codigoLote} onChange={e => setCodigoLote(e.target.value)} placeholder="Ej: L-2024001" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha Fabricación</label>
                                            <input type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required value={fechaFab} onChange={e => setFechaFab(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                                            <input type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:col-start-2">
                                            Guardar
                                        </button>
                                        <button type="button" onClick={() => setModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:col-start-1 sm:mt-0">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
