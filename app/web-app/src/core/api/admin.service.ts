import api from './client';

export const AdminService = {
    // Organizer Approvals
    getPendingOrganizers: () => api.get('/admin/organizers/pending'),
    approveOrganizer: (id: string) => api.patch(`/admin/organizers/${id}/approve`),
    rejectOrganizer: (id: string, reason: string) => api.patch(`/admin/organizers/${id}/reject`, { reason }),

    // Event Approvals
    getPendingEvents: () => api.get('/admin/events/pending'),
    approveEvent: (id: string) => api.patch(`/admin/events/${id}/approve`),
    rejectEvent: (id: string, reason: string) => api.patch(`/admin/events/${id}/reject`, { reason }),

    // Analytics
    getPlatformStats: () => api.get('/admin/stats/overview'),
    getFraudAlerts: () => api.get('/admin/fraud/alerts'),
};
