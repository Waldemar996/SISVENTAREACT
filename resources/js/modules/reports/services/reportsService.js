import api from '../../../shared/services/api';

export const reportsService = {
    // Get aggregated sales stats (CQRS/Optimized)
    getSalesStats: (filters) => {
        // Dashboard returns { kpis, charts }
        return api.get('/api/reportes/dashboard', { params: filters });
    },

    // Get daily sales for charts (Included in dashboard response usually, but separated if needed)
    // For now, we will reuse dashboard or call specific endpoint if it existed.
    // Given Controller structure, dashboard returns 'ventas_semanales'.
    getDailySales: (filters) => {
        return api.get('/api/reportes/dashboard', { params: filters });
    },

    // Export to PDF/Excel (Download blob)
    exportReport: (type, filters) => {
        // Type could be 'ventas', 'cajas', etc.
        // Endpoint: /api/reportes/ventas?export=true
        let endpoint = '/api/reportes/ventas';
        if (type === 'cajas') endpoint = '/api/reportes/cajas';
        if (type === 'kardex') endpoint = '/api/reportes/kardex';

        return api.get(endpoint, {
            params: { ...filters, export: 'true' },
            responseType: 'blob' // Important for file download
        });
    }
};
