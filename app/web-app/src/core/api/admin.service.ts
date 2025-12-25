import api from './client';

export const AdminService = {
    // Organizer Management
    getPendingOrganizers: () => api.get('/profiles/admin/organizers'),

    reviewOrganizer: (id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string) =>
        api.post(`/profiles/admin/organizers/${id}/review`, { status, adminNote }),

    // Event Management
    getEvents: () => api.get('/events/admin/list'),
    reviewEvent: (id: number, status: 'APPROVED' | 'REJECTED', commission: any) =>
        api.post(`/events/${id}/review`, { status, ...commission }),

    // Financials
    getFinancialTransactions: () => api.get('/financials/admin/transactions'),
    getFinancialMetrics: () => api.get('/financials/admin/dashboard'),

    // Fraud & Security
    getFraudAlerts: () => api.get('/security/fraud/alerts'),
    getFraudMetrics: () => api.get('/security/fraud/metrics'),

    // Platform KPIs
    getStats: () => api.get('/admin/stats'),
};
