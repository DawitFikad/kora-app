import api from './client';

export const AdminService = {
    // Organizer Management
    getPendingOrganizers: () => api.get('/profiles/admin/organizers?status=PENDING'),
    getApprovedOrganizers: () => api.get('/profiles/admin/organizers?status=APPROVED'),
    getRejectedOrganizers: () => api.get('/profiles/admin/organizers?status=REJECTED'),

    reviewOrganizer: (id: number, status: 'APPROVED' | 'REJECTED', adminNote?: string, commission?: any) =>
        api.post(`/profiles/admin/organizers/${id}/review`, { status, adminNote, ...commission }),

    // Event Management
    getEvents: () => api.get('/events/admin/list'),
    reviewEvent: (id: number, status: 'APPROVED' | 'REJECTED', commission: any, adminNote?: string) =>
        api.post(`/events/${id}/review`, { status, adminNote, ...commission }),

    // Financials
    getFinancialTransactions: (params?: any) => api.get('/financials/transactions', { params }),
    getFinancialMetrics: (params?: any) => api.get('/financials/dashboard', { params }),
    // Financial Control - GMV, Revenue, Payouts, Ledger
    getGMV: (params?: any) => api.get('/financials/gmv', { params }),
    getGMVByCity: (params?: any) => api.get('/financials/gmv/cities', { params }),
    getGMVByOrganizer: (params?: any) => api.get('/financials/gmv/organizers', { params }),
    getPlatformRevenue: (params?: any) => api.get('/financials/revenue', { params }),
    getOrganizerPayouts: (params?: any) => api.get('/financials/payouts', { params }),
    getSettlementLedger: (params?: any) => api.get('/financials/ledger', { params }),
    exportSettlementLedgerCSV: (params?: any) => api.get('/financials/ledger/export', { params, responseType: 'blob' }),
    getFinancialDefinitions: () => api.get('/admin/financial-definitions'),
    togglePaymentsReadOnly: (enabled: boolean) => api.post('/admin/payments/read-only', { enabled }),
    // Content & Discovery
    getCategories: () => api.get('/content/categories'),
    getCities: () => api.get('/content/cities'),
    toggleFeaturedEvent: (eventId: number, featured: boolean) => api.patch(`/admin/events/${eventId}/featured`, { featured }),
    getPendingPayouts: () => api.get('/payouts/pending'),
    getProcessedPayouts: () => api.get('/payouts/processed'),
    approvePayout: (batchId: number, adminNote?: string) => api.post(`/payouts/${batchId}/approve`, { adminNote }),
    rejectPayout: (batchId: number, reason: string) => api.post(`/payouts/${batchId}/reject`, { reason }),

    // Security & Tickets
    invalidateTicket: (ticketId: string, reason: string) => api.post(`/tickets/${ticketId}/invalidate`, { reason }),
    getFraudAlerts: () => api.get('/security/fraud/alerts'),
    getFraudMetrics: () => api.get('/security/fraud/metrics'),
    resolveFraudAlert: (id: number, adminNote: string) => api.patch(`/security/fraud/alerts/${id}/resolve`, { adminNote }),
    getFraudAlertDetail: (id: number) => api.get(`/security/fraud/alerts/${id}`),

    // Platform KPIs
    getStats: () => api.get('/admin/stats'),
    getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),
    getNotifications: (params?: any) => api.get('/admin/notifications', { params }),
    getAuditLogs: (params?: any) => api.get('/admin/notifications', { params: { recipient: 'Audit Log', ...params } }),
    deleteAuditLog: (id: number) => api.delete(`/admin/notifications/${id}`),
    clearAuditLogs: () => api.delete('/admin/notifications/clear'),
    respondToFeatureRequest: (notificationId: number, approved: boolean, options?: { priority?: string; revenueEstimate?: number; adminNote?: string }) =>
        api.post(`/admin/feature-requests/${notificationId}/respond`, { approved, ...(options || {}) }),
    // Platform Fees
    getPlatformFees: () => api.get('/admin/fees'),
    updatePlatformFee: (data: any) => api.patch('/admin/fees', data),
    // System Config
    getSystemConfigs: () => api.get('/admin/config'),
    updateSystemConfig: (data: { key: string, value: string, description?: string }) => api.patch('/admin/config', data),
    inviteAdmin: (data: { email: string, phoneNumber: string, fullName: string, role: string }) => api.post('/admin/invite', data),
    getTeamMembers: () => api.get('/admin/users', { params: { role: 'ADMIN' } }),
    getInvitationHistory: () => api.get('/admin/notifications', { params: { title: 'Admin Invited' } }),
    removeAdmin: (userId: number) => api.delete(`/admin/users/${userId}`),
};
