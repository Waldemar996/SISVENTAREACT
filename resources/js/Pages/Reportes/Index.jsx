import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import PageHeader from '@/Components/Layout/PageHeader';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Table from '@/Components/UI/Table';
import Badge from '@/Components/UI/Badge';
import { DocumentTextIcon, TruckIcon, BanknotesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ReportCenter({ auth }) {
    const [selectedReport, setSelectedReport] = useState('ventas_detalle');
    const [params, setParams] = useState({
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date().toISOString().split('T')[0],
        estado: '',
        forma_pago: ''
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [productSearch, setProductSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productOptions, setProductOptions] = useState([]);

    const reportTypes = [
        { id: 'ventas_detalle', name: 'Ventas Detalladas', icon: BanknotesIcon, group: 'Ventas' },
        { id: 'compras_detalle', name: 'Compras Detalladas', icon: TruckIcon, group: 'Compras' },
        { id: 'inventario_valorizado', name: 'Existencias Valorizadas', icon: TruckIcon, group: 'Inventario' },
        { id: 'kardex', name: 'Kardex (Movimientos)', icon: TruckIcon, group: 'Inventario' },
        { id: 'cajas_historial', name: 'Historial de Cajas', icon: DocumentTextIcon, group: 'Tesorería' },
        { id: 'cxc', name: 'Cuentas Por Cobrar', icon: DocumentTextIcon, group: 'Finanzas' },
    ];

    const searchProducts = async (query) => {
        if (!query) return;
        const res = await axios.get('/api/inventario/productos', { params: { search: query, limit: 10 } });
        setProductOptions(res.data.data || res.data); // Adjust based on API structure
    };

    const handleGenerate = async () => {
        if (selectedReport === 'kardex' && !selectedProduct) {
            alert('Debe seleccionar un producto para el Kardex.');
            return;
        }

        setLoading(true);
        try {
            let endpoint = '';
            let currentParams = { ...params };

            if (selectedReport === 'ventas_detalle') endpoint = '/api/reportes/ventas';
            if (selectedReport === 'compras_detalle') endpoint = '/api/reportes/compras';
            if (selectedReport === 'inventario_valorizado') endpoint = '/api/reportes/inventario';
            if (selectedReport === 'cxc') endpoint = '/api/reportes/cxc';
            if (selectedReport === 'cajas_historial') endpoint = '/api/reportes/cajas';
            if (selectedReport === 'kardex') {
                endpoint = '/api/reportes/kardex';
                currentParams.producto_id = selectedProduct.id;
            }

            const res = await axios.get(endpoint, { params: currentParams });
            if (res.data.data) {
                setData(res.data.data);
            } else {
                setData(res.data);
            }
        } catch (error) {
            console.error(error);
            alert('Error al generar el reporte.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Centro de Reportes" />

            <div className="flex h-screen bg-gray-100 overflow-hidden">
                {/* Sidebar - HIDDEN ON PRINT */}
                <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto print:hidden">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold text-gray-800">Reportes</h2>
                    </div>
                    <div className="p-2">
                        {reportTypes.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => { setSelectedReport(report.id); setData([]); }}
                                className={`w-full flex items-center p-3 mb-1 rounded-md text-sm font-medium transition-colors ${selectedReport === report.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <report.icon className="h-5 w-5 mr-3" />
                                {report.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header / Filters - HIDDEN ON PRINT */}
                    <div className="bg-white border-b border-gray-200 p-6 shadow-sm z-10 print:hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {reportTypes.find(r => r.id === selectedReport)?.name || 'Seleccione Reporte'}
                            </h1>
                            <div className="flex space-x-2">
                                <Button
                                    className="flex items-center"
                                    onClick={() => {
                                        let url = '';
                                        const query = new URLSearchParams(params).toString();

                                        if (selectedReport === 'ventas_detalle') url = `/reportes/pdf/ventas?${query}`;
                                        if (selectedReport === 'compras_detalle') url = `/reportes/pdf/compras?${query}`;
                                        if (selectedReport === 'inventario_valorizado') url = `/reportes/pdf/inventario?${query}`;
                                        if (selectedReport === 'cxc') url = `/reportes/pdf/cxc?${query}`;
                                        if (selectedReport === 'cajas_historial') url = `/reportes/pdf/cajas?${query}`;
                                        if (selectedReport === 'kardex') {
                                            if (!selectedProduct) { alert('Seleccione Producto'); return; }
                                            url = `/reportes/pdf/kardex?${query}&producto_id=${selectedProduct.id}`;
                                        }

                                        if (url) window.open(url, '_blank');
                                    }}
                                    variant="secondary"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                    Descargar PDF Oficial
                                </Button>
                            </div>
                        </div>

                        {/* Parameter Form */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {(selectedReport !== 'inventario_valorizado' && selectedReport !== 'cxc') && (
                                <>
                                    <Input label="Fecha Inicio" type="date" value={params.fecha_inicio} onChange={(e) => setParams({ ...params, fecha_inicio: e.target.value })} />
                                    <Input label="Fecha Fin" type="date" value={params.fecha_fin} onChange={(e) => setParams({ ...params, fecha_fin: e.target.value })} />
                                </>
                            )}

                            {(selectedReport === 'ventas_detalle' || selectedReport === 'compras_detalle') && (
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md" value={params.estado} onChange={(e) => setParams({ ...params, estado: e.target.value })}>
                                        <option value="">Todos</option>
                                        <option value="COMPLETADO">Completado</option>
                                        <option value="PENDIENTE">Pendiente</option>
                                    </select>
                                </div>
                            )}

                            {selectedReport === 'kardex' && (
                                <div className="col-span-2 space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Producto (Buscar por Nombre/SKU)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Escriba para buscar..."
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                if (e.target.value.length > 2) searchProducts(e.target.value);
                                            }}
                                        />
                                        {productOptions.length > 0 && productSearch && !selectedProduct && (
                                            <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 max-h-48 overflow-y-auto shadow-lg rounded-md">
                                                {productOptions.map(prod => (
                                                    <li
                                                        key={prod.id}
                                                        className="p-2 hover:bg-indigo-50 cursor-pointer text-sm"
                                                        onClick={() => {
                                                            setSelectedProduct(prod);
                                                            setProductSearch(`${prod.codigo_sku} - ${prod.nombre}`);
                                                            setProductOptions([]);
                                                        }}
                                                    >
                                                        <span className="font-bold">{prod.codigo_sku}</span> - {prod.nombre}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    {selectedProduct && <div className="text-xs text-green-600 font-bold">Seleccionado: {selectedProduct.nombre}</div>}
                                </div>
                            )}

                            {selectedReport !== 'ventas_detalle' && selectedReport !== 'compras_detalle' && selectedReport !== 'kardex' && (
                                <div className="col-span-3 text-sm text-gray-500 flex items-center">Se generará el reporte con los valores actuales.</div>
                            )}

                            <Button onClick={handleGenerate} disabled={loading} className="w-full">
                                {loading ? 'Generando...' : 'Generar Reporte'}
                            </Button>
                        </div>
                    </div>

                    {/* PRINT ONLY HEADER */}
                    <div className="hidden print:block p-8 border-b border-gray-300">
                        <h1 className="text-3xl font-bold text-gray-900 text-center uppercase tracking-wide">
                            {reportTypes.find(r => r.id === selectedReport)?.name}
                        </h1>
                        <p className="text-center text-gray-500 mt-2">Generado el: {new Date().toLocaleString()}</p>
                        {(selectedReport === 'ventas_detalle' || selectedReport === 'compras_detalle') && (
                            <p className="text-center text-sm mt-1">
                                Período: {params.fecha_inicio} al {params.fecha_fin}
                            </p>
                        )}
                    </div>

                    {/* Report Result Area */}
                    <div className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
                        {data.length === 0 && !loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 print:hidden">
                                <DocumentTextIcon className="h-16 w-16 mb-4" />
                                <p className="text-lg">Seleccione parámetros y presione Generar</p>
                            </div>
                        ) : (
                            <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:rounded-none">
                                {selectedReport === 'compras_detalle' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Doc</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Proveedor</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Estado</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(row.fecha_emision)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{row.numero_comprobante}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{row.proveedor?.razon_social || 'Proveedor General'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><Badge variant={row.estado === 'COMPLETADO' ? 'success' : 'warning'}>{row.estado}</Badge></td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(row.total_compra)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                <td colSpan="4" className="px-6 py-4 text-right uppercase">Total Compras:</td>
                                                <td className="px-6 py-4 text-right">
                                                    {formatCurrency(data.reduce((sum, row) => sum + Number(row.total_compra), 0))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'ventas_detalle' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Doc</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Total</th>
                                                <th className="px-6 py-3 text-center font-bold text-gray-700 uppercase">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(row.fecha_emision)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{row.numero_comprobante}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{row.cliente?.razon_social || 'Consumidor'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(row.total_venta)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs">{row.estado}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                <td colSpan="3" className="px-6 py-4 text-right uppercase">Total General:</td>
                                                <td className="px-6 py-4 text-right">
                                                    {formatCurrency(data.reduce((sum, row) => sum + Number(row.total_venta), 0))}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'inventario_valorizado' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">SKU</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Producto</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Categoría</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Stock</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Costo Prom</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{row.codigo_sku}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{row.nombre}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{row.categoria}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{row.stock_total}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{formatCurrency(row.costo_promedio)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(row.valor_total)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                <td colSpan="5" className="px-6 py-4 text-right uppercase">Valor Total Inventario:</td>
                                                <td className="px-6 py-4 text-right">
                                                    {formatCurrency(data.reduce((sum, row) => sum + Number(row.valor_total), 0))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'cxc' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Fecha Factura</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Total Original</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Abonado</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Saldo Pendiente</th>
                                                <th className="px-6 py-3 text-center font-bold text-gray-700 uppercase">Días Mora</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{row.cliente}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(row.fecha).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(row.total)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{formatCurrency(row.pagado)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">{formatCurrency(row.saldo)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">{row.dias_mora}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                                <td colSpan="4" className="px-6 py-4 text-right uppercase">Total Por Cobrar:</td>
                                                <td className="px-6 py-4 text-right text-red-700">
                                                    {formatCurrency(data.reduce((sum, row) => sum + Number(row.saldo), 0))}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'cajas_historial' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Apertura/Cierre</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Usuario</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Inicial</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Calculado</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Real</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Dif</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>{formatDate(row.fecha_apertura)}</div>
                                                        <div className="text-xs text-gray-500">{row.fecha_cierre ? formatDate(row.fecha_cierre) : 'ABIERTA'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{row.usuario?.username}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(row.monto_inicial)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(row.monto_final_sistema)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(row.monto_final_real)}</td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${row.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(row.diferencia)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {selectedReport === 'kardex' && (
                                    <table className="min-w-full divide-y divide-gray-200 text-sm print:text-xs">
                                        <thead className="bg-gray-50 print:bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Tipo</th>
                                                <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase">Referencia</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Entrada</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Salida</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 break-inside-avoid">
                                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(row.fecha)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{row.tipo_movimiento}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                                                        {row.referencia_tipo} #{row.referencia_id} <br /> {row.glosa}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{row.cantidad > 0 ? row.cantidad : ''}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">{row.cantidad < 0 ? row.cantidad : ''}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">{row.stock_nuevo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
