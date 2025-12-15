import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function Print({ venta, empresa }) {

    useEffect(() => {
        window.print();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-GT', options);
    };

    return (
        <div className="font-sans p-8 max-w-4xl mx-auto bg-white text-gray-900 print:max-w-none print:p-0">
            <Head title={`Venta ${venta.numero_comprobante}`} />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase">{empresa?.nombre_empresa || 'Mi Empresa S.A.'}</h1>
                    <p className="text-sm">{empresa?.direccion || 'Ciudad, Guatemala'}</p>
                    <p className="text-sm">NIT: {empresa?.nit || 'CF'}</p>
                    <p className="text-sm">Tel: {empresa?.telefono || '5555-5555'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-700">FACTURA DE VENTA</h2>
                    <p className="text-lg font-mono text-red-600 font-bold">{venta.numero_comprobante}</p>
                    <p className="text-sm text-gray-500">Fecha: {formatDate(venta.fecha_emision || venta.created_at)}</p>
                    {venta.tipo_comprobante && <p className="text-xs font-bold badge badge-outline mt-1">{venta.tipo_comprobante}</p>}
                </div>
            </div>

            {/* Cliente */}
            <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold">Cliente</p>
                        <p className="text-lg font-bold">{venta.cliente?.razon_social || 'Cliente Final'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold">NIT / CUI</p>
                        <p>{venta.cliente?.nit || 'CF'}</p>
                    </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    <span className="font-bold">Dirección:</span> {venta.cliente?.direccion_entrega || 'Ciudad'}
                </div>
            </div>

            {/* Detalles */}
            <table className="w-full mb-6 border-collapse">
                <thead>
                    <tr className="bg-gray-800 text-white text-sm">
                        <th className="py-2 px-3 text-left">DESCRIPCIÓN</th>
                        <th className="py-2 px-3 text-right">CANT</th>
                        <th className="py-2 px-3 text-right">PRECIO UNIT.</th>
                        <th className="py-2 px-3 text-right">SUBTOTAL</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {venta.detalles?.map((det, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-2 px-3">
                                <p className="font-bold">{det.producto?.nombre}</p>
                                <p className="text-xs text-gray-500">{det.producto?.marca?.nombre} - SKU: {det.producto?.codigo_sku}</p>
                            </td>
                            <td className="py-2 px-3 text-right">{det.cantidad}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(det.precio_unitario)}</td>
                            <td className="py-2 px-3 text-right font-bold">{formatCurrency(det.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end mb-8">
                <div className="w-64">
                    <div className="flex justify-between py-1 border-b border-gray-200 text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(venta.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200 text-sm">
                        <span className="text-gray-600">Impuestos:</span>
                        <span>{formatCurrency(venta.total_impuestos)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xl font-bold bg-gray-100 px-2 mt-2 rounded">
                        <span>TOTAL:</span>
                        <span>{formatCurrency(venta.total_venta)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-800 pt-4 text-center text-sm text-gray-500">
                <p>Gracias por su compra.</p>
                <p>Este documento es un comprobante interno. Serie FEL: {venta.fel_serie || 'PENDIENTE'} UUID: {venta.fel_uuid || 'PENDIENTE'}</p>
            </div>

            <div className="mt-8 text-xs text-center text-gray-400 no-print">
                <p>Generado por Sistema Enterprise V9 - {new Date().toLocaleString()}</p>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
