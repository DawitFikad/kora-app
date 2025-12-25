import api from './client';

export const OrganizerService = {
    // Dashboard & Stats
    getOverview: () => api.get('/organizer/overview'),

    // Event Management
    getMyEvents: () => api.get('/organizer/events'),
    getEventById: (id: number) => api.get(`/organizer/events/${id}`),
    createEvent: (data: any) => api.post('/organizer/events', data),
    updateEvent: (id: number, data: any) => api.patch(`/organizer/events/${id}`, data),

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

    // Settings
    getSettings: () => api.get('/organizer/settings'),
    updateSettings: (data: any) => api.patch('/organizer/settings', data),
};
