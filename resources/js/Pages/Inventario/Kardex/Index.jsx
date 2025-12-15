import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ClipboardDocumentListIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/Components/Layout/PageHeader';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import SearchBar from '@/Components/UI/SearchBar';
import Badge from '@/Components/UI/Badge';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import EmptyState from '@/Components/UI/EmptyState';

export default function Index({ auth }) {
    const [movimientos, setMovimientos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProducto, setFilterProducto] = useState('');
    const [filterBodega, setFilterBodega] = useState('');
    const [filterTipo, setFilterTipo] = useState('all');

    useEffect(() => { fetchData(); }, []);

    // Refresh when filters change
    useEffect(() => {
        if (!loading) { // Avoid double fetch on mount
            fetchData();
        }
    }, [filterProducto, filterBodega]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = {};
            if (filterProducto) params.producto_id = filterProducto;
            if (filterBodega) params.bodega_id = filterBodega;

            const [movRes, prodRes, bodRes] = await Promise.all([
                axios.get('/api/inventario/kardex/consultar', { params }),
                axios.get('/api/inventario/productos'),
                axios.get('/api/logistica/bodegas')
            ]);

            // movRes.data.movimientos is the pagination wrapper
            setMovimientos(movRes.data.movimientos.data || []);
            setProductos(prodRes.data.data || prodRes.data);
            setBodegas(bodRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar kardex');
        } finally {
            setLoading(false);
        }
    };

    const filteredMovimientos = movimientos.filter(mov => {
        const matchesSearch = (mov.producto?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (mov.numero_documento?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesTipo = filterTipo === 'all' || mov.tipo_movimiento === filterTipo;
        return matchesSearch && matchesTipo;
    });

    const getTipoMovimientoBadge = (tipo) => {
        const variants = {
            entrada: 'success',
            salida: 'danger',
            ajuste: 'warning',
            traslado: 'info'
        };
        const labels = {
            entrada: 'ENTRADA',
            salida: 'SALIDA',
            ajuste: 'AJUSTE',
            traslado: 'TRASLADO'
        };
        return <Badge variant={variants[tipo] || 'neutral'}>{labels[tipo] || tipo.toUpperCase()}</Badge>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('/api/inventario/kardex/export', {
                params: {
                    producto_id: filterProducto,
                    bodega_id: filterBodega,
                    tipo: filterTipo !== 'all' ? filterTipo : null
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `kardex_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Kardex exportado correctamente');
        } catch (error) {
            toast.error('Error al exportar kardex');
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Kardex - Inventario" />

            <PageHeader
                title="Kardex de Inventario"
                breadcrumbs={[
                    { label: 'Inventario', href: route('inventario.productos') },
                    { label: 'Kardex' }
                ]}
                actions={
                    <Button onClick={handleExport} variant="secondary">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Exportar
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por producto..."
                        className="flex-1"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={filterProducto}
                            onChange={(e) => setFilterProducto(e.target.value)}
                            className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm min-w-[200px]"
                        >
                            <option value="">Todos los productos</option>
                            {productos.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                            ))}
                        </select>
                        <select
                            value={filterBodega}
                            onChange={(e) => setFilterBodega(e.target.value)}
                            className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        >
                            <option value="">Todas las bodegas</option>
                            {bodegas.map(bod => (
                                <option key={bod.id} value={bod.id}>{bod.nombre}</option>
                            ))}
                        </select>
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                            className="rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                            <option value="ajuste">Ajustes</option>
                            <option value="traslado">Traslados</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner className="py-12" />
                ) : filteredMovimientos.length === 0 ? (
                    <EmptyState
                        icon={ClipboardDocumentListIcon}
                        title="No hay movimientos"
                        description={filterProducto ? 'No hay operaciones registradas para este producto' : 'Selecciona un producto para ver su historial detallado'}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Bodega</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Documento</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Cantidad</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Costo Unit.</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredMovimientos.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {mov.fecha}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTipoMovimientoBadge(mov.tipo_movimiento)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{mov.producto?.nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {mov.bodega?.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {mov.referencia || '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${mov.tipo_movimiento === 'entrada' ? 'text-green-600' :
                                                mov.tipo_movimiento === 'salida' ? 'text-red-600' : 'text-amber-600'
                                            }`}>
                                            {mov.tipo_movimiento === 'entrada' ? '+' : '-'}{mov.cantidad}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                                            {formatCurrency(mov.costo_unitario)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary-600">
                                            {mov.saldo_cantidad}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
