import api from '../../../shared/services/api';

export const inventoryService = {
    // List products with server-side pagination/filtering
    getProducts: (params) => {
        // params: { page, per_page, search, category_id, etc. }
        return api.get('/api/inventario/productos', { params });
    },

    // Get specific product details (for editing/viewing)
    getProduct: (id) => {
        return api.get(`/api/inventario/productos/${id}`);
    },

    // Get Kardex (Movement History)
    getKardex: (params) => {
        return api.get('/api/inventario/kardex/consultar', { params });
    },

    // Create Stock Adjustment (Strict Audit)
    createAdjustment: (data) => {
        // data: { producto_id, cantidad, tipo_movimiento, motivo, bodega_id }
        return api.post('/api/inventario/ajustes', data);
    },

    // Get Analytics (Low stock, etc)
    getAnalytics: () => {
        return api.get('/api/inventario/analytics');
    }
};
