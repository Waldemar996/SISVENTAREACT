import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

export default function Control({ auth }) {
    const [estado, setEstado] = useState(null); // null = loading, false = no session, true = session active
    const [sesionData, setSesionData] = useState(null);
    const [cajasDisponibles, setCajasDisponibles] = useState([]);

    // Form Inputs
    const [selectedCaja, setSelectedCaja] = useState('');
    const [montoInicial, setMontoInicial] = useState('');
    const [montoCierre, setMontoCierre] = useState('');

    const [loading, setLoading] = useState(false);
    const [auditResult, setAuditResult] = useState(null); // For closing summary

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            // Check if user has active session
            const res = await axios.get('/api/tesoreria/sesion/estado');
            if (res.data.tiene_sesion) {
                setEstado(true);
                setSesionData(res.data.sesion);
            } else {
                setEstado(false);
                fetchCajasDisponibles();
            }
        } catch (error) {
            console.error("Error checking session status", error);
            setEstado(false);
        }
    };

    const fetchCajasDisponibles = async () => {
        try {
            const res = await axios.get('/api/tesoreria/cajas');
            // Filter only available ones
            const disponibles = res.data.filter(c => c.estado === 'disponible');
            setCajasDisponibles(disponibles);
        } catch (error) {
            console.error("Error fetching boxes", error);
        }
    };

    const handleOpenSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/tesoreria/sesion/aperturar', {
                caja_id: selectedCaja,
                monto_inicial: montoInicial
            });
            // Reload page or state to show active session
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al abrir caja');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSession = async (e) => {
        e.preventDefault();
        if (!confirm("¿Estás seguro de realizar el Corte de Caja? Esta acción es irreversible.")) return;

        setLoading(true);
        try {
            const res = await axios.post('/api/tesoreria/sesion/cerrar', {});
            setAuditResult(res.data);
            setEstado(false); // Session closed
            setSesionData(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al cerrar caja');
        } finally {
            setLoading(false);
        }
    };

    if (estado === null) return <div className="p-10 text-center">Cargando estado de tesorería...</div>;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Control de Caja y Turnos</h2>}
        >
            <Head title="Control Caja" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                    {/* AUDIT SUMMARY AFTER CLOSING */}
                    {auditResult && (
                        <div className="mb-8 bg-green-50 border-l-4 border-green-400 p-4 shadow-lg rounded-r">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg leading-6 font-medium text-green-800">{auditResult.message}</h3>
                                    <div className="mt-2 text-sm text-green-700 grid grid-cols-2 gap-4">
                                        <p>Fondo Inicial: <span className="font-bold">Q{auditResult.resumen.inicial}</span></p>
                                        <p>Ventas Sistema: <span className="font-bold">Q{auditResult.resumen.ventas}</span></p>
                                        <p>Esperado en Caja: <span className="font-bold">Q{auditResult.resumen.esperado}</span></p>
                                        <p>Reportado por tí: <span className="font-bold">Q{auditResult.resumen.real}</span></p>
                                        <p className={`col-span-2 text-lg border-t pt-2 ${auditResult.resumen.diferencia == 0 ? 'text-green-800' : 'text-red-600'}`}>
                                            Diferencia (Faltante/Sobrante): <span className="font-bold">Q{auditResult.resumen.diferencia}</span>
                                        </p>
                                    </div>
                                    <div className="mt-4 flex gap-4">
                                        <button onClick={() => setAuditResult(null)} className="text-sm underline text-green-900">Volver a pantalla de inicio</button>
                                        <a
                                            href={`/tesoreria/sesion/${auditResult.sesion_id || auditResult.data?.id || ''}/ticket`}
                                            target="_blank"
                                            className="px-4 py-2 bg-green-700 text-white rounded text-sm font-bold shadow hover:bg-green-800 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Imprimir Comprobante
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!estado && !auditResult && (
                        /* OPEN SESSION VIEW */
                        <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div className="p-8 border-b border-gray-200">
                                <div className="text-center mb-8">
                                    <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Iniciar Nuevo Turno</h2>
                                    <p className="mt-2 text-gray-600">Para comenzar a vender, debes asignarte una caja y declarar tu fondo inicial de sencillo.</p>
                                </div>

                                <form onSubmit={handleOpenSession} className="max-w-md mx-auto space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Seleccionar Caja Disponible</label>
                                        <select
                                            value={selectedCaja}
                                            onChange={(e) => setSelectedCaja(e.target.value)}
                                            required
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">-- Selecciona una caja --</option>
                                            {cajasDisponibles.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre_caja} ({c.bodega?.nombre})</option>
                                            ))}
                                        </select>
                                        {cajasDisponibles.length === 0 && <p className="text-red-500 text-xs mt-1">No hay cajas disponibles. Pide al admin que cree una o libere alguna.</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fondo Inicial (Sencillo)</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">Q</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={montoInicial}
                                                onChange={(e) => setMontoInicial(e.target.value)}
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || cajasDisponibles.length === 0}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Abriendo...' : 'ABRIR CAJA'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {estado && sesionData && (
                        /* ACTIVE SESSION / CLOSE VIEW */
                        <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div className="p-6 bg-indigo-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold">Turno Activo</h2>
                                        <p className="opacity-90">Caja: <span className="font-semibold">{sesionData.caja?.nombre_caja}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm opacity-75">Iniciado a las</p>
                                        <p className="text-xl font-mono">{new Date(sesionData.fecha_apertura).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex space-x-8">
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase tracking-wide">Fondo Inicial</p>
                                        <p className="text-2xl font-bold">Q{sesionData.monto_inicial}</p>
                                    </div>
                                    {/* Real-time sales usually fetched via separate API or implicit logic. For now static or simple */}
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase tracking-wide">Estado</p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            OPERANDO
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Cierre de Caja (Arqueo)</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Cuenta todo el dinero en efectivo que tienes en la caja y escribe el total a continuación.
                                    El sistema comparará esto contra las ventas registradas.
                                </p>

                                <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                    <p className="text-gray-600 mb-6">
                                        ¿Deseas finalizar tu turno? El sistema calculará automáticamente el total esperado.
                                    </p>
                                    <button
                                        onClick={handleCloseSession}
                                        disabled={loading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Cerrando Turno...' : 'FINALIZAR TURNO Y CERRAR'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
