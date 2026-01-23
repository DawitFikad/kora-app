import api from './client';

export const AdminService = {
    // Organizer Management
    getPendingOrganizers: () => api.get('/profiles/admin/organizers?status=PENDING'),
    getApprovedOrganizers: () => api.get('/profiles/admin/organizers?status=APPROVED'),

    reviewOrganizer: (id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string, commission?: any) =>
        api.post(`/profiles/admin/organizers/${id}/review`, { status, adminNote, ...commission }),

    // Event Management
    getEvents: () => api.get('/events/admin/list'),
    reviewEvent: (id: number, status: 'APPROVED' | 'REJECTED', commission: any) =>
        api.post(`/events/${id}/review`, { status, ...commission }),

    // Financials
    getFinancialTransactions: () => api.get('/financials/transactions'),
    getFinancialMetrics: () => api.get('/financials/dashboard'),
    // Content & Discovery
    getCategories: () => api.get('/content/categories'),
    getCities: () => api.get('/content/cities'),
    toggleFeaturedEvent: (eventId: number, featured: boolean) => api.patch(`/admin/events/${eventId}/featured`, { featured }),
    getPendingPayouts: () => api.get('/payouts/pending'),
    getProcessedPayouts: () => api.get('/payouts/processed'),
    approvePayout: (batchId: number) => api.post(`/payouts/${batchId}/approve`),
    rejectPayout: (batchId: number, reason: string) => api.post(`/payouts/${batchId}/reject`, { reason }),

    // Security & Tickets
    invalidateTicket: (ticketId: string, reason: string) => api.post(`/tickets/${ticketId}/invalidate`, { reason }),
    getFraudAlerts: () => api.get('/security/fraud/alerts'),
    getFraudMetrics: () => api.get('/security/fraud/metrics'),
    resolveFraudAlert: (id: number, adminNote: string) => api.patch(`/security/fraud/alerts/${id}/resolve`, { adminNote }),
    getFraudAlertDetail: (id: number) => api.get(`/security/fraud/alerts/${id}`),

    // Platform KPIs
    getStats: () => api.get('/admin/stats'),
    getAnalytics: () => api.get('/admin/analytics'),
    getNotifications: () => api.get('/admin/notifications'),
    getAuditLogs: () => api.get('/admin/notifications?recipient=Audit Log'),
    respondToFeatureRequest: (notificationId: number, approved: boolean) => api.post(`/admin/feature-requests/${notificationId}/respond`, { approved }),
    // Platform Fees
    getPlatformFees: () => api.get('/admin/fees'),
    updatePlatformFee: (data: any) => api.patch('/admin/fees', data),
    // System Config
    getSystemConfigs: () => api.get('/admin/config'),
    updateSystemConfig: (data: { key: string, value: string, description?: string }) => api.patch('/admin/config', data),
    inviteAdmin: (data: { email: string, phoneNumber: string, fullName: string, role: string }) => api.post('/admin/invite', data),
};
