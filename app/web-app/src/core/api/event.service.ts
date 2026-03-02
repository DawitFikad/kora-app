import api from './client';

export interface PublicEvent {
    [x: string]: any;
    id: number;
    title: string;
    description?: string | null;
    venue: string;
    dateTime: string;
    coverImage?: string | null;
    featured?: boolean;
    category?: { name: string } | null;
    city?: { name: string } | null;
    organizer?: { organizationName?: string | null } | null;
    tiers?: Array<{ price: number }>;
}

export const EventService = {
    getEvents: async (params?: {
        categoryId?: number;
        subCategoryId?: number;
        cityId?: number;
        search?: string;
        featured?: boolean;
    }): Promise<PublicEvent[]> => {
        const response: any = await api.get('/events', { params });
        return Array.isArray(response) ? response : response?.data || [];
    },

    getMetadata: async (): Promise<{ categories: any[]; cities: any[] }> => {
        const response: any = await api.get('/events/meta');
        return response || { categories: [], cities: [] };
    }
};
