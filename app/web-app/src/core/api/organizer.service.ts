import api from './client';

export const OrganizerService = {
    // Dashboard & Stats
    getOverview: () => api.get('/organizer/overview'),
    getEventStats: (id: number) => api.get(`/organizer/events/${id}/dashboard`),

    // Event Management
    getMyEvents: () => api.get('/organizer/events'),
    getEventById: (id: number) => api.get(`/organizer/events/${id}`),
    createEvent: (data: any) => api.post('/organizer/events', data),
    updateEvent: (id: number, data: any) => api.patch(`/organizer/events/${id}`, data),
    requestFeature: (id: number) => api.post(`/organizer/events/${id}/feature`),

    // Financials
    getWalletBalance: () => api.get('/organizer/wallet'),
    getFinancials: () => api.get('/organizer/financials'),
    getPayoutHistory: () => api.get('/organizer/payouts'),
    requestPayout: (amount: number, method: string) => api.post('/organizer/payouts/request', { amount, method }),

    // Tickets
    getTicketStats: () => api.get('/organizer/ticket-stats'),

    // Attendees
    getAttendees: () => api.get('/organizer/attendees'),
    getEventAttendees: (eventId: string) => api.get(`/organizer/events/${eventId}/attendees`),

    // Promotions
    createPromoCode: (data: any) => api.post('/organizer/promos', data),
    getPromoCodes: () => api.get('/organizer/promos'),

    // Settings
    getSettings: () => api.get('/organizer/settings'),
    updateSettings: (data: any) => api.patch('/organizer/settings', data),


    // Payment Methods (Payout Methods)
    getPaymentMethods: () => api.get('/organizer/payment-methods'),
    addPaymentMethod: (data: any) => api.post('/organizer/payment-methods', data),
    deletePaymentMethod: (id: number) => api.delete(`/organizer/payment-methods/${id}`),
    setDefaultPaymentMethod: (id: number) => api.patch(`/organizer/payment-methods/${id}/default`),

    // Notifications
    getNotifications: () => api.get('/organizer/notifications'),
    markNotificationsRead: (data: { notificationIds?: number[], markAll?: boolean }) => api.patch('/organizer/notifications/read', data),

    // Financials/Billing
    getPayoutHistory: () => api.get('/organizer/payouts'),

    // Support
    contactSupport: (data: { subject: string, message: string }) => api.post('/organizer/support', data),

    // Profile Management  
    uploadLogo: (formData: FormData) => api.post('/organizer/profile/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    removeLogo: () => api.delete('/organizer/profile/remove-logo'),
    changePassword: (data: { currentPassword: string, newPassword: string }) => api.post('/organizer/profile/change-password', data),
    requestPhoneChange: (newPhoneNumber: string) => api.post('/organizer/profile/change-phone-request', { newPhoneNumber }),
    verifyPhoneChange: (data: { newPhoneNumber: string, otp: string }) => api.post('/organizer/profile/change-phone-verify', data),

    // Validation
    validateTicket: (qrPayload: string, gateId?: string) => api.post('/validate/scan', { qrPayload, gateId }),
    getSyncData: (eventId: number) => api.get(`/validate/sync/${eventId}`),
    syncLogs: (logs: any[]) => api.post('/validate/sync', { logs }),
};
