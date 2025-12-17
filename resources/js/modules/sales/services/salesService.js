import api from '../../../shared/services/api';

export const salesService = {
    // Search products with debounce (handled in component)
    searchProducts: (query) => {
        // Using the "search" method in OperVentaController (or separate search endpoint)
        // Adjust params to match backend expectations (OperVentaController::search uses 'numero', we need product search)
        // Since OperVentaController::search searches SALES, we need InvProductoController index with filters.
        return api.get('/api/inventario/productos', {
            params: { search: query, per_page: 10 }
        });
    },

    // Calculate totals on backend (Authoritative)
    calculateTotals: (items) => {
        // Prepare items DTO
        const payload = items.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad
        }));

        return api.post('/api/operaciones/ventas/calcular-totales', { items: payload });
    },

    // Create Sale
    createSale: (saleData) => {
        return api.post('/api/operaciones/ventas', saleData);
    }
};
