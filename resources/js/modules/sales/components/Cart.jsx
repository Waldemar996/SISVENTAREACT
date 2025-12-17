import React from 'react';
import Button from '../../../shared/ui/Button.jsx';

export default function Cart({ items, onUpdateQuantity, onRemove }) {
    if (items.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                Carrito vacío. Escanea o busca un producto.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                                <div className="text-xs text-gray-500">{item.codigo_sku}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                Q{Number(item.precio_venta_base).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.cantidad - 1))}
                                    >-</Button>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-16 text-center border-gray-300 rounded-md text-sm"
                                        value={item.cantidad}
                                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                                    >+</Button>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                Q{(item.precio_venta_base * item.cantidad).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => onRemove(item.id)}
                                >
                                    Eliminar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
