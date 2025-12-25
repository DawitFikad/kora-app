import api from './client';

export const OrganizerService = {
    // Event Management
    getMyEvents: () => api.get('/organizer/events'),
    createEvent: (data: any) => api.post('/organizer/events', data),
    updateEvent: (id: string, data: any) => api.patch(`/organizer/events/${id}`, data),

    // Financials
    getWalletBalance: () => api.get('/organizer/wallet'),
    getPayoutHistory: () => api.get('/organizer/payouts'),
    requestPayout: (amount: number, method: string) => api.post('/organizer/payouts/request', { amount, method }),

    // Attendees
    getEventAttendees: (eventId: string) => api.get(`/organizer/events/${eventId}/attendees`),
};
