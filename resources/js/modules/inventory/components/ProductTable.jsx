import React from 'react';
import Button from '../../../shared/ui/Button.jsx';

export default function ProductTable({ products, onEdit, onAdjust, loading }) {
    if (loading) {
        return <div className="p-4 text-center text-gray-500">Cargando inventario...</div>;
    }

    if (!products || products.length === 0) {
        return <div className="p-4 text-center text-gray-500">No hay productos registrados.</div>;
    }

    return (
        <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Base</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                {product.codigo_interno || product.codigo_sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${(product.stock_total || 0) <= (product.stock_minimo || 5)
                                        ? 'bg-red-100 text-red-800' // Low Stock Warning
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                    {product.stock_total || 0} {product.unidad?.codigo || 'UN'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                Q{Number(product.precio_venta_base).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.categoria?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <Button size="sm" variant="secondary" onClick={() => onEdit(product)}>
                                    Editar
                                </Button>
                                <Button size="sm" variant="primary" onClick={() => onAdjust(product)}>
                                    Ajustar Stock
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
