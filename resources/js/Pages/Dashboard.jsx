import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    BanknotesIcon,
    ShoppingCartIcon,
    CubeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChartPieIcon,
    ReceiptPercentIcon,
    FireIcon
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import MiniSparkline from '@/Components/Dashboard/MiniSparkline';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ auth, stats }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const data = stats || {
        resumen: {
            ventas_mes: 0, ventas_hoy: 0, valor_inventario: 0, compras_mes: 0,
            margen_mes: 0, ticket_promedio: 0, cantidad_ventas_hoy: 0,
            tendencia_ventas: { porcentaje: 0, direccion: 'neutral' },
            tendencia_compras: { porcentaje: 0, direccion: 'neutral' },
            tendencia_margen: { porcentaje: 0, direccion: 'neutral' },
            sparkline_ventas: [],
            sparkline_compras: [],
            sparkline_margen: []
        },
        graficaVentas: [],
        topProductos: [],
        ventasPorCategoria: [],
        productosCriticos: [],
        actividadReciente: [],
        alertas: { stock_bajo: 0, compras_pendientes: 0 }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Enterprise Dashboard" />

            {/* Premium Header Section */}
            <div className="relative mb-8 p-8 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-200 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30 backdrop-blur-sm">
                                Vista General
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            Panel de Control
                        </h1>
                        <p className="text-indigo-200 mt-2 text-lg font-light">
                            Resumen de operaciones al <span className="font-semibold text-white">{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {data.alertas.stock_bajo > 0 && (
                            <Link href="/inventario/kardex" className="flex items-center gap-2 px-5 py-3 bg-rose-500/20 text-rose-200 rounded-xl text-sm font-semibold border border-rose-500/30 hover:bg-rose-500/30 backdrop-blur-md transition-all shadow-lg shadow-rose-900/20 hover:scale-105">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                <span className="drop-shadow-sm">{data.alertas.stock_bajo} Alertas Stock</span>
                            </Link>
                        )}
                        {data.alertas.compras_pendientes > 0 && (
                            <Link href="/operaciones/compras" className="flex items-center gap-2 px-5 py-3 bg-blue-500/20 text-blue-200 rounded-xl text-sm font-semibold border border-blue-500/30 hover:bg-blue-500/30 backdrop-blur-md transition-all shadow-lg shadow-blue-900/20 hover:scale-105">
                                <ClockIcon className="w-5 h-5" />
                                {data.alertas.compras_pendientes} Pedidos
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards - 6 Cards Grid with Sparklines */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <KpiCard
                    title="Ventas del Mes"
                    value={formatMoney(data.resumen.ventas_mes)}
                    icon={BanknotesIcon}
                    color="indigo"
                    trend={data.resumen.tendencia_ventas}
                    sparkline={data.resumen.sparkline_ventas}
                    sparklineColor="#4F46E5"
                    footer={`${data.resumen.cantidad_ventas_mes || 0} transacciones`}
                />
                <KpiCard
                    title="Ventas Hoy"
                    value={formatMoney(data.resumen.ventas_hoy)}
                    icon={ArrowTrendingUpIcon}
                    color="emerald"
                    footer={`${data.resumen.cantidad_ventas_hoy} ventas realizadas`}
                />
                <KpiCard
                    title="Margen Bruto"
                    value={formatMoney(data.resumen.margen_mes)}
                    icon={ReceiptPercentIcon}
                    color="purple"
                    trend={data.resumen.tendencia_margen}
                    sparkline={data.resumen.sparkline_margen}
                    sparklineColor="#8B5CF6"
                    footer="Ventas - Compras del mes"
                />
                <KpiCard
                    title="Ticket Promedio"
                    value={formatMoney(data.resumen.ticket_promedio)}
                    icon={ChartPieIcon}
                    color="cyan"
                    footer="Promedio por transacción"
                />
                <KpiCard
                    title="Valor Inventario"
                    value={formatMoney(data.resumen.valor_inventario)}
                    icon={CubeIcon}
                    color="blue"
                    footer="Costo total en almacenes"
                />
                <KpiCard
                    title="Compras del Mes"
                    value={formatMoney(data.resumen.compras_mes)}
                    icon={ShoppingCartIcon}
                    color="rose"
                    trend={data.resumen.tendencia_compras}
                    sparkline={data.resumen.sparkline_compras}
                    sparklineColor="#F43F5E"
                    footer="Gastos operativos"
                />
            </div>

            {/* Critical Stock Alert Panel */}
            {data.productosCriticos && data.productosCriticos.length > 0 && (
                <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                                <FireIcon className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-red-900 mb-1">⚠️ Productos en Estado Crítico</h3>
                                <p className="text-sm text-red-700 mb-4">Los siguientes productos tienen stock por debajo del 50% del mínimo requerido</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.productosCriticos.map((prod, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate" title={prod.nombre}>{prod.nombre}</p>
                                                    <p className="text-xs text-gray-500 truncate">{prod.categoria}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex-shrink-0">
                                                    {prod.porcentaje}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                                <span className="text-gray-600">Stock: <strong className="text-red-600">{prod.stock_actual}</strong></span>
                                                <span className="text-gray-400">/</span>
                                                <span className="text-gray-600">Mín: <strong>{prod.stock_minimo}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/inventario/kardex" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                                    Ver Inventario Completo →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Main Graph: Sales vs Purchases */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Flujo de Dinero (Últimos 7 Días)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.graficaVentas}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `Q${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => formatMoney(value)}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                                <Area type="monotone" dataKey="compras" name="Compras" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorCompras)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Sales by Category */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Categoría</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        {data.ventasPorCategoria && data.ventasPorCategoria.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.ventasPorCategoria}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={(entry) => `${entry.name}`}
                                    >
                                        {data.ventasPorCategoria.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-400 text-sm">Sin datos de categorías</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Top Products & Recent Activity */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Productos (Mes)</h3>
                    <div className="space-y-3">
                        {data.topProductos.map((prod, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate" title={prod.nombre}>{prod.nombre}</p>
                                        <p className="text-xs text-gray-500">{prod.cantidad_vendida} Unidades</p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-indigo-600 flex-shrink-0">{formatMoney(prod.total_vendido)}</p>
                            </div>
                        ))}
                        {data.topProductos.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">Sin datos de ventas aún.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Actividad Reciente</h3>
                        <Link href="/reportes" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">Ver Todo →</Link>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {data.actividadReciente.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.tipo === 'venta' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={item.titulo}>{item.titulo}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate" title={item.mensaje}>{item.mensaje}</p>
                                        </div>
                                        <p className={`text-sm font-semibold whitespace-nowrap flex-shrink-0 ${item.tipo === 'venta' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                            {item.tipo === 'venta' ? '+' : '-'}{formatMoney(item.monto)}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(item.fecha).toLocaleString('es-GT', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {data.actividadReciente.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-8">No hay actividad reciente.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function KpiCard({ title, value, icon: Icon, color, trend, sparkline, sparklineColor, footer }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    };

    const TrendIcon = trend?.direccion === 'up' ? ArrowTrendingUpIcon :
        trend?.direccion === 'down' ? ArrowTrendingDownIcon : null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            {TrendIcon && (
                                <TrendIcon className={`w-4 h-4 ${trend.direccion === 'up' ? 'text-emerald-600' :
                                    trend.direccion === 'down' ? 'text-rose-600' :
                                        'text-gray-400'
                                    }`} />
                            )}
                            <span className={`text-sm font-semibold ${trend.direccion === 'up' ? 'text-emerald-600' :
                                trend.direccion === 'down' ? 'text-rose-600' :
                                    'text-gray-400'
                                }`}>
                                {trend.porcentaje}%
                            </span>
                            <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${colors[color] || colors.indigo}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {/* Sparkline */}
            {sparkline && sparkline.length > 0 && (
                <div className="mt-2 -mx-2">
                    <MiniSparkline data={sparkline} color={sparklineColor || '#4F46E5'} />
                </div>
            )}

            {footer && <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">{footer}</p>}
        </div>
    );
}
