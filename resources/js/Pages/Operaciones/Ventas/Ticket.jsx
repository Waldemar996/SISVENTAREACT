import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function Ticket({ venta, empresa }) {

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
        const options = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-GT', options);
    };

    return (
        <div className="font-mono p-2 max-w-[80mm] mx-auto bg-white text-black text-xs print:p-0 print:max-w-none">
            <Head title={`Ticket ${venta.numero_comprobante}`} />

            {/* Header */}
            <div className="text-center mb-4 border-b border-black border-dashed pb-2">
                <h1 className="font-bold text-sm uppercase">{empresa?.nombre_empresa || 'SISVENTA'}</h1>
                <p>{empresa?.direccion || 'Ciudad'}</p>
                <p>NIT: {empresa?.nit || 'CF'} | Tel: {empresa?.telefono}</p>
                <div className="mt-2">
                    <p className="font-bold">TICKET DE VENTA</p>
                    <p>#{venta.numero_comprobante}</p>
                    <p>{formatDate(venta.fecha_emision || venta.created_at)}</p>
                </div>
            </div>

            {/* Cliente */}
            <div className="mb-2 border-b border-black border-dashed pb-2">
                <p><span className="font-bold">Cliente:</span> {venta.cliente?.razon_social || 'Consumidor Final'}</p>
                <p><span className="font-bold">NIT:</span> {venta.cliente?.nit || 'CF'}</p>
            </div>

            {/* Detalles */}
            <table className="w-full mb-2">
                <thead>
                    <tr className="border-b border-black text-left">
                        <th className="py-1">Desc</th>
                        <th className="py-1 text-right">Cant</th>
                        <th className="py-1 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {venta.detalles?.map((det, index) => (
                        <tr key={index}>
                            <td className="py-1 pr-1 truncate max-w-[40mm]">
                                {det.producto?.nombre}
                            </td>
                            <td className="py-1 text-right">{det.cantidad}</td>
                            <td className="py-1 text-right font-bold">{formatCurrency(det.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end mb-4 border-t border-black border-dashed pt-2">
                <div className="text-right w-full">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(venta.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-1">
                        <span>TOTAL:</span>
                        <span>{formatCurrency(venta.total_venta)}</span>
                    </div>
                    <div className="text-xs mt-1">
                        <span>Pago: {venta.metodo_pago?.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] mb-4">
                <p>¡Gracias por su compra!</p>
                <p>Serie: {venta.fel_serie || '---'} | UUID: {venta.fel_uuid ? venta.fel_uuid.substring(0, 8) : '---'}</p>
                <p className="mt-2">Original</p>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: 80mm auto; /* ancho auto-altura */
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 2mm; /* Pequeño padding interno */
                        width: 80mm;
                    }
                    /* Ocultar headers/footers del navegador si es posible */
                    html, body {
                        height: auto;
                    }
                }
                /* Para visualización en pantalla */
                body {
                    background-color: #f3f4f6;
                    display: flex;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
}
