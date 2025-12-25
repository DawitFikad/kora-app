import api from './client';

export const AdminService = {
    // Organizer Management
    getPendingOrganizers: () => api.get('/profiles/admin/organizers?status=PENDING'),
    getApprovedOrganizers: () => api.get('/profiles/admin/organizers?status=APPROVED'),

    reviewOrganizer: (id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string) =>
        api.post(`/profiles/admin/organizers/${id}/review`, { status, adminNote }),

    // Event Management
    getEvents: () => api.get('/events/admin/list'),
    reviewEvent: (id: number, status: 'APPROVED' | 'REJECTED', commission: any) =>
        api.post(`/events/${id}/review`, { status, ...commission }),

    // Financials
    getFinancialTransactions: () => api.get('/financials/admin/transactions'),
    getFinancialMetrics: () => api.get('/financials/admin/dashboard'),
    // Content & Discovery
    getCategories: () => api.get('/content/categories'),
    getCities: () => api.get('/content/cities'),
    toggleFeaturedEvent: (eventId: number, featured: boolean) => api.patch(`/admin/events/${eventId}/featured`, { featured }),
    getPendingPayouts: () => api.get('/payouts/pending'),
    approvePayout: (batchId: number) => api.post(`/payouts/${batchId}/approve`),

    // Security & Tickets
    invalidateTicket: (ticketId: string, reason: string) => api.post(`/tickets/${ticketId}/invalidate`, { reason }),
    getFraudAlerts: () => api.get('/security/fraud/alerts'),
    getFraudMetrics: () => api.get('/security/fraud/metrics'),

    // Platform KPIs
    getStats: () => api.get('/admin/stats'),
    getAnalytics: () => api.get('/admin/analytics'),
};
