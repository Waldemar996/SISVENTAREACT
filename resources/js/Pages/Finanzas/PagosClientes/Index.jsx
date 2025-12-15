import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function Index({ auth }) {
    const [pendientes, setPendientes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Payment Modal
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [montoAbono, setMontoAbono] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/finanzas/pagos-clientes');
            setPendientes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (venta) => {
        setSelectedVenta(venta);
        setMontoAbono(''); // Reset
    };

    const handlePagar = async (e) => {
        e.preventDefault();
        if (!selectedVenta) return;

        try {
            await axios.post('/api/finanzas/pagos-clientes', {
                venta_id: selectedVenta.id,
                monto_abonado: montoAbono,
                metodo_pago: metodoPago,
                referencia: 'Abono CXC'
            });
            alert("✅ Abono registrado correctamente.");
            setSelectedVenta(null);
            fetchData();
        } catch (error) {
            alert("❌ Error: " + (error.response?.data?.message || "Algo salió mal"));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800">Cuentas por Cobrar (CXC)</h2>}>
            <Head title="Cobros" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-700">Facturas Pendientes de Pago</h3>
                        <button onClick={fetchData} className="text-indigo-600 hover:text-indigo-900 text-sm">🔄 Actualizar</button>
                    </div>

                    {pendientes.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            🎉 ¡No hay deudas pendientes! Todos los clientes están al día.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Venta</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-red-600 uppercase">Saldo Pendiente</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendientes.map((v) => (
                                    <tr key={v.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{v.numero_comprobante}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.cliente?.nombre_comercial}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(v.fecha_emision).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">Q{Number(v.total_venta).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-red-600">Q{Number(v.saldo_pendiente).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleOpenModal(v)}
                                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition"
                                            >
                                                💰 Abonar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Abono */}
            {selectedVenta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-2">Registrar Abono</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Factura: {selectedVenta.numero_comprobante} <br />
                            Saldo Actual: <span className="font-bold text-red-600">Q{Number(selectedVenta.saldo_pendiente).toFixed(2)}</span>
                        </p>

                        <form onSubmit={handlePagar}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Monto a Abonar</label>
                                <input
                                    type="number" step="0.01" max={selectedVenta.saldo_pendiente}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                    value={montoAbono}
                                    onChange={e => setMontoAbono(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300"
                                    value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setSelectedVenta(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Cobrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
