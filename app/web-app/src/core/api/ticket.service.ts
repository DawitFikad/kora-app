import api from './client';

export interface Ticket {
    id: string;
    ticketCode: string;
    code?: string;
    qrPayload: string;
    status: 'VALID' | 'USED' | 'CANCELLED';
    seatNumber?: string;
    event: {
        title: string;
        dateTime: string;
        venue: string;
        coverImage: string | null;
    };
    tier: {
        name: string;
    };
}
export const ticketService = {
    getMyTickets: async (): Promise<Ticket[]> => {
        const response: any = await api.get('/ticketing/me');
        const rawTickets = Array.isArray(response.data) ? response.data : [];

        return rawTickets.map((ticket: any) => ({
            ...ticket,
            // API returns `code`; UI uses `ticketCode` for display/manual entry.
            ticketCode: ticket.ticketCode || ticket.code || ''
        }));
    }
};
