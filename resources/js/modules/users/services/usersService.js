import api from '../../../shared/services/api';

export const usersService = {
    // Users
    getUsers: (params) => api.get('/api/security/users', { params }),
    createUser: (data) => api.post('/api/security/users', data),
    updateUser: (id, data) => api.put(`/api/security/users/${id}`, data),
    toggleUserStatus: (id) => api.post(`/api/security/users/${id}/toggle-status`),

    // Roles
    getRoles: () => api.get('/api/security/roles'),
    createRole: (data) => api.post('/api/security/roles', data),
    updateRolePermissions: (roleId, permissions) => api.put(`/api/security/roles/${roleId}/permissions`, { permissions }),

    // Permissions (Constants or List)
    getPermissions: () => api.get('/api/security/permissions'),

    // Audit Logs (Security View)
    getAuditLogs: (params) => api.get('/api/security/audit-logs', { params }),
};
