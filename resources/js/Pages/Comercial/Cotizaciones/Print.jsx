import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';

export default function Print({ cotizacion, empresa }) {
    useEffect(() => {
        // Auto-print when loaded
        if (cotizacion) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [cotizacion]);

    if (!cotizacion) return <div>Cargando datos...</div>;

    const subtotal = cotizacion.detalles.reduce((acc, det) => acc + (Number(det.cantidad) * Number(det.precio_unitario)), 0);
    // Simple tax logic, can be enhanced
    const impuestos = 0;
    const total = subtotal;

    return (
        <div className="bg-white min-h-screen text-gray-800 font-sans p-8 print:p-0">
            <Head title={`Cotización ${cotizacion.codigo_cotizacion}`} />

            {/* Print Container */}
            <div className="max-w-4xl mx-auto border print:border-0 p-8 print:p-0 bg-white shadow-lg print:shadow-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                    <div className="flex items-center">
                        {empresa.ruta_logo ? (
                            <img src={`/storage/${empresa.ruta_logo}`} alt="Logo" className="h-20 w-auto object-contain mr-4" />
                        ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                SIN LOGO
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{empresa.nombre_empresa}</h1>
                            <p className="text-sm text-gray-500">{empresa.direccion_fiscal}</p>
                            <p className="text-sm text-gray-500">NIT: {empresa.nit_empresa}</p>
                            <p className="text-sm text-gray-500">{empresa.email_contacto} | {empresa.website}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-extrabold text-indigo-600 mb-2">COTIZACIÓN</h2>
                        <p className="text-lg font-mono font-bold text-gray-700">#{cotizacion.codigo_cotizacion}</p>
                        <p className="text-sm text-gray-500 mt-1">Fecha Emisión: {new Date(cotizacion.fecha_emision).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">Vence: {new Date(cotizacion.fecha_vencimiento).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Cliente Info */}
                <div className="flex justify-between mb-8 bg-gray-50 p-4 rounded print:bg-transparent print:p-0">
                    <div className="w-1/2 pr-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
                        <p className="font-bold text-lg text-gray-900">{cotizacion.cliente.razon_social}</p>
                        <p className="text-sm text-gray-600">{cotizacion.cliente.direccion}</p>
                        <p className="text-sm text-gray-600">NIT/DPI: {cotizacion.cliente.nit}</p>
                        <p className="text-sm text-gray-600">{cotizacion.cliente.email}</p>
                    </div>
                    <div className="w-1/2 pl-4 border-l border-gray-200 print:border-gray-300">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Condiciones</h3>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Vendedor:</span> {cotizacion.usuario?.username || 'Sistema'}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Moneda:</span> Quetzales (GTQ)</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Validez:</span> 15 Días</p>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-indigo-500 text-left">
                            <th className="py-2 text-sm font-bold text-gray-700 uppercase">Descripción</th>
                            <th className="py-2 text-sm font-bold text-gray-700 uppercase text-center">Cant.</th>
                            <th className="py-2 text-sm font-bold text-gray-700 uppercase text-right">Precio Unit.</th>
                            <th className="py-2 text-sm font-bold text-gray-700 uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cotizacion.detalles.map((det, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 pr-4">
                                    <p className="font-bold text-gray-800">{det.producto?.nombre}</p>
                                    <p className="text-xs text-gray-500">{det.producto?.sku} - {det.producto?.marca?.nombre}</p>
                                </td>
                                <td className="py-3 px-2 text-center text-gray-700">{det.cantidad}</td>
                                <td className="py-3 px-2 text-right text-gray-700">Q{Number(det.precio_unitario).toFixed(2)}</td>
                                <td className="py-3 pl-4 text-right font-bold text-gray-800">Q{Number(det.cantidad * det.precio_unitario).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 sm:w-1/3">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Subtotal</span>
                            <span className="text-gray-800">Q{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Impuestos</span>
                            <span className="text-gray-800">Q{impuestos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b-2 border-indigo-600">
                            <span className="text-xl font-bold text-indigo-700">TOTAL</span>
                            <span className="text-xl font-bold text-indigo-700">Q{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer/Terms */}
                <div className="border-t border-gray-200 pt-8">
                    <h4 className="font-bold text-xs text-gray-500 uppercase mb-2">Términos y Condiciones</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        Esta cotización es válida por el período indicado. Los precios están sujetos a cambios sin previo aviso si la cotización ha vencido.
                        El tiempo de entrega se confirmará al momento de recibir la Orden de Compra.
                    </p>
                    <div className="flex justify-between items-end mt-12">
                        <div className="text-center w-64 border-t border-gray-400 pt-2">
                            <p className="text-sm font-semibold text-gray-700">Firma Autorizada</p>
                        </div>
                        <div className="text-center w-64 border-t border-gray-400 pt-2">
                            <p className="text-sm font-semibold text-gray-700">Aceptado Cliente</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Print Button (Hide when printing) */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center transition transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir / Guardar PDF
                </button>
            </div>
        </div>
    );
}
