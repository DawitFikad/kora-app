import api from './client';

export const AdminService = {
    // Organizer Management
    getPendingOrganizers: () => api.get('/profiles/admin/organizers'),

    reviewOrganizer: (id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string) =>
        api.post(`/profiles/admin/organizers/${id}/review`, { status, adminNote }),

    // Potential future endpoints
    getStats: () => api.get('/admin/stats'), // We might need to implement this
};
