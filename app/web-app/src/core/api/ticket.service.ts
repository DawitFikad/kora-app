import api from './client';

export interface Ticket {
    id: string;
    ticketCode: string;
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
        return response.data;
    }
};
