import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout.jsx';
import { Head } from '@inertiajs/react';
import DateRangeFilter from '../components/DateRangeFilter.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import { reportsService } from '../services/reportsService';

const KPICard = ({ title, value, subtext, color = 'blue' }) => (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 border-${color}-500`}>
        <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
            {subtext && <dd className="mt-1 text-sm text-gray-400">{subtext}</dd>}
        </div>
    </div>
);

export default function SalesReportsPage({ auth }) {
    const [stats, setStats] = useState({ total_ventas: 0, total_ganancia: 0, cantidad_ventas: 0 });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        date_from: new Date().toISOString().slice(0, 10), // Today
        date_to: new Date().toISOString().slice(0, 10)
    });

    const loadStats = async () => {
        setLoading(true);
        try {
            // Uncomment for real API
            // const response = await reportsService.getSalesStats(filters);
            // setStats(response.data);

            // Mock Data
            setTimeout(() => {
                setStats({
                    total_ventas: 15420.50,
                    total_ganancia: 3200.00,
                    cantidad_ventas: 45
                });
            }, 600);
        } catch (error) {
            console.error("Error loading stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async (type) => {
        try {
            await reportsService.exportReport(type, filters);
            alert(`Reporte ${type} descargado (Simulación)`);
        } catch (error) {
            alert("Error exportando reporte");
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Reportes de Ventas</h2>}
        >
            <Head title="Reportes" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filters & Actions */}
                    <div className="bg-white p-4 shadow sm:rounded-lg flex flex-col sm:flex-row justify-between items-center bg-gray-50">
                        <DateRangeFilter filters={filters} onChange={handleFilterChange} />
                        <div className="mt-4 sm:mt-0">
                            <ExportButtons onExport={handleExport} loading={loading} />
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <KPICard
                            title="Ventas Totales"
                            value={`Q${Number(stats.total_ventas).toLocaleString()}`}
                            subtext="Periodo Seleccionado"
                            color="blue"
                        />
                        <KPICard
                            title="Ganancia Bruta"
                            value={`Q${Number(stats.total_ganancia).toLocaleString()}`}
                            subtext="Margen Estimado"
                            color="green"
                        />
                        <KPICard
                            title="Transacciones"
                            value={stats.cantidad_ventas}
                            subtext="Tickets Emitidos"
                            color="purple"
                        />
                    </div>

                    {/* Mock Chart Area */}
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Tendencia Diaria (Simulada)</h3>
                        <div className="h-64 flex items-end justify-between space-x-2 border-b border-l border-gray-200 p-4">
                            {[40, 60, 45, 80, 30, 90, 100].map((h, i) => (
                                <div key={i} className="w-full flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t-sm"
                                        style={{ height: `${h}%` }}
                                    ></div>
                                    <span className="text-xs text-gray-500 mt-2">Día {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
