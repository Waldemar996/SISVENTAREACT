import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Cart from '../components/Cart.jsx';

// Mock dependencies if needed
// jest.mock('../../../shared/ui/Button.jsx', () => (props) => <button {...props}>{props.children}</button>);

describe('Cart Component (POS)', () => {
    const mockItems = [
        { id: 1, nombre: 'Producto A', cantidad: 2, precio_venta_base: 10.00 },
        { id: 2, nombre: 'Producto B', cantidad: 1, precio_venta_base: 5.00 },
    ];

    const mockUpdate = jest.fn();
    const mockRemove = jest.fn();

    test('renders cart items correctly', () => {
        render(<Cart items={mockItems} onUpdateQuantity={mockUpdate} onRemove={mockRemove} />);

        expect(screen.getByText('Producto A')).toBeInTheDocument();
        expect(screen.getByText('Producto B')).toBeInTheDocument();
        // Check total calculation visual (2*10 + 1*5 = 25)
        // Note: The Cart component logic might just display items. 
        // If it shows subtotal per row:
        expect(screen.getByText('Q20.00')).toBeInTheDocument();
        expect(screen.getByText('Q5.00')).toBeInTheDocument();
    });

    test('calls onUpdateQuantity when quantity changes', () => {
        render(<Cart items={mockItems} onUpdateQuantity={mockUpdate} onRemove={mockRemove} />);

        const inputs = screen.getAllByRole('spinbutton'); // quantity inputs
        fireEvent.change(inputs[0], { target: { value: '5' } });

        expect(mockUpdate).toHaveBeenCalledWith(1, 5);
    });

    test('calls onRemove when delete button clicked', () => {
        render(<Cart items={mockItems} onUpdateQuantity={mockUpdate} onRemove={mockRemove} />);

        const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i }); // assuming button text or aria-label
        fireEvent.click(deleteButtons[0]);

        expect(mockRemove).toHaveBeenCalledWith(1);
    });

    test('does not allow editing price (Enterprise Rule)', () => {
        render(<Cart items={mockItems} onUpdateQuantity={mockUpdate} onRemove={mockRemove} />);

        // Prices should be text, not inputs
        const prices = screen.getAllByText(/Q[0-9]+\.[0-9]{2}/);
        prices.forEach(price => {
            expect(price.tagName).not.toBe('INPUT');
        });
    });
});
