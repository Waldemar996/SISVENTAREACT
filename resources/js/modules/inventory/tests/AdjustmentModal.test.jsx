import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdjustmentModal from '../components/AdjustmentModal.jsx';

// Mock Button/Input to avoid module import issues in test environment if not fully configured
jest.mock('../../../shared/ui/Button.jsx', () => ({ children, onClick, disabled, loading }) => (
    <button onClick={onClick} disabled={disabled} data-testid="modal-btn">
        {loading ? 'Loading...' : children}
    </button>
));
jest.mock('../../../shared/ui/Input.jsx', () => ({ value, onChange, label }) => (
    <label>
        {label}
        <input value={value} onChange={onChange} type="number" />
    </label>
));

describe('AdjustmentModal (Audit Security)', () => {
    const mockProduct = { id: 99, nombre: 'Producto Test' };
    const mockConfirm = jest.fn();
    const mockClose = jest.fn();

    beforeEach(() => {
        mockConfirm.mockClear();
        mockClose.mockClear();
    });

    test('validates audit reason before enabling confirm', () => {
        render(<AdjustmentModal isOpen={true} product={mockProduct} onConfirm={mockConfirm} onClose={mockClose} />);

        const confirmBtn = screen.getByText('Confirmar Ajuste');

        // Initially disabled (No Qty, No Reason)
        expect(confirmBtn).toBeDisabled();

        // Add Qty
        const qtyInput = screen.getByLabelText('Cantidad');
        fireEvent.change(qtyInput, { target: { value: '10' } });
        expect(confirmBtn).toBeDisabled(); // Still disabled (No Reason)

        // Add Reason
        const reasonInput = screen.getByPlaceholderText('Explique la razón del ajuste...');
        fireEvent.change(reasonInput, { target: { value: 'Corrección física' } });

        // Now Enabled
        expect(confirmBtn).not.toBeDisabled();
    });

    test('submits correct payload including audit fields', async () => {
        render(<AdjustmentModal isOpen={true} product={mockProduct} onConfirm={mockConfirm} onClose={mockClose} />);

        // Fill form
        fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '5' } });
        fireEvent.change(screen.getByPlaceholderText('Explique la razón del ajuste...'), { target: { value: 'Merma verificada' } });

        // Change Type (Default ENTRADA, change to SALIDA)
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'SALIDA' } });

        // Submit
        fireEvent.click(screen.getByText('Confirmar Ajuste'));

        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith({
                producto_id: 99,
                cantidad: 5,
                tipo_movimiento: 'SALIDA',
                motivo: 'Merma verificada' // Critical for Audit
            });
        });
    });
});
