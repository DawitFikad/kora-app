import api from './client';

export interface TicketTier {
    id: number;
    name: string;
    price: number;
    capacity: number;
    soldCount: number;
    available: number;
}

export interface EventForBooking {
    id: number;
    title: string;
    description: string | null;
    venue: string;
    dateTime: string;
    coverImage: string | null;
    eventType: 'CAPACITY' | 'SEAT_MAP';
    category: string;
    city: string;
    organizer: string;
    feeType: string;
    feeFixed: number;
    feePercentage: number;
    tiers: TicketTier[];
}

export interface SeatStatus {
    seatNumber: string;
    status: 'available' | 'locked' | 'sold';
    lockedBy?: number;
    ttl?: number;
}

export interface PriceBreakdown {
    basePrice: number;
    ticketPrice: number;
    subtotal: number;
    commission: number;
    convenienceFee: number;
    discount: number;
    total: number;
    promoApplied?: {
        code: string;
        type: string;
        value: number;
    };
}

export interface BookingResponse {
    success: boolean;
    purchaseId?: number;
    paymentRef?: string;
    priceBreakdown?: PriceBreakdown;
    lockExpiry?: string;
    error?: string;
}

export const bookingService = {
    /**
     * Get event details for booking page
     */
    getEventForBooking: async (eventId: number): Promise<EventForBooking> => {
        const response: any = await api.get(`/booking/events/${eventId}`);
        return response.data;
    },

    /**
     * Get real-time seat status for seat map events
     */
    getSeatStatus: async (eventId: number, tierId: number): Promise<SeatStatus[]> => {
        const response: any = await api.get(`/booking/events/${eventId}/tiers/${tierId}/seats`);
        return response.data;
    },

    /**
     * Calculate price breakdown with optional promo code
     */
    calculatePrice: async (
        eventId: number,
        tierId: number,
        quantity: number,
        promoCode?: string
    ): Promise<PriceBreakdown> => {
        const response: any = await api.post('/booking/calculate-price', {
            eventId,
            tierId,
            quantity,
            promoCode
        });
        return response.data;
    },

    /**
     * Validate a promo code
     */
    validatePromoCode: async (code: string, eventId: number): Promise<{ valid: boolean; message?: string }> => {
        const response: any = await api.post('/booking/validate-promo', { code, eventId });
        return response.data;
    },

    /**
     * Lock seats for selection (SEAT_MAP events)
     */
    lockSeats: async (
        eventId: number,
        tierId: number,
        seatNumbers: string[]
    ): Promise<{ lockedSeats: string[]; expiry: string }> => {
        const response: any = await api.post('/booking/lock-seats', {
            eventId,
            tierId,
            seatNumbers
        });
        return response.data;
    },

    /**
     * Release seat locks
     */
    releaseSeats: async (
        eventId: number,
        tierId: number,
        seatNumbers: string[]
    ): Promise<void> => {
        await api.post('/booking/release-seats', {
            eventId,
            tierId,
            seatNumbers
        });
    },

    /**
     * Create a booking reservation
     */
    createReservation: async (data: {
        eventId: number;
        tierId: number;
        quantity: number;
        seatNumbers?: string[];
        paymentMethod?: string;
        promoCode?: string;
    }): Promise<BookingResponse> => {
        const response: any = await api.post('/booking/reserve', data);
        return response;
    },

    /**
     * Get purchase details
     */
    getPurchase: async (purchaseId: number): Promise<any> => {
        const response: any = await api.get(`/booking/${purchaseId}`);
        return response.data;
    },

    /**
     * Extend lock time for a pending reservation
     */
    extendLock: async (purchaseId: number): Promise<{ newExpiry: string }> => {
        const response: any = await api.post(`/booking/${purchaseId}/extend`);
        return response;
    },

    /**
     * Cancel a pending reservation
     */
    cancelReservation: async (purchaseId: number): Promise<void> => {
        await api.post(`/booking/${purchaseId}/cancel`);
    }
};
