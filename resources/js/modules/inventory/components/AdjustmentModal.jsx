import React, { useState } from 'react';
import Button from '../../../shared/ui/Button.jsx';
import Input from '../../../shared/ui/Input.jsx';

export default function AdjustmentModal({ isOpen, onClose, product, onConfirm }) {
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState('ENTRADA');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onConfirm({
                producto_id: product.id,
                cantidad: Number(quantity),
                tipo_movimiento: type,
                motivo: reason
            });
            onClose();
        } catch (error) {
            console.error("Adjustment failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Ajuste de Inventario: {product.nombre}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
                                <select
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="ENTRADA">Entrada (Compra/Devolución)</option>
                                    <option value="SALIDA">Salida (Merma/Ajuste Negativo)</option>
                                </select>
                            </div>

                            <Input
                                label="Cantidad"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Motivo (Obligatorio para Auditoría)</label>
                                <textarea
                                    className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    rows="3"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explique la razón del ajuste..."
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={loading || !quantity || !reason || quantity <= 0}
                            loading={loading}
                        >
                            Confirmar Ajuste
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="mt-3 sm:mt-0 sm:mr-3"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
