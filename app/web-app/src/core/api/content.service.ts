import api from './client';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export const ContentService = {
    getCategories: () => api.get<any, ApiResponse<any[]>>('/content/categories'),
    getCategoryDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/categories/${id}`),
    getCities: () => api.get<any, ApiResponse<any[]>>('/content/cities'),
    getCityDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/cities/${id}`),

    addCategory: (name: string, slug: string) => api.post<any, ApiResponse<any>>('/content/categories', { name, slug }),
    removeCategory: (id: number) => api.delete<any, ApiResponse<any>>(`/content/categories/${id}`),

    addCity: (name: string, slug: string) => api.post<any, ApiResponse<any>>('/content/cities', { name, slug }),
    removeCity: (id: number) => api.delete<any, ApiResponse<any>>(`/content/cities/${id}`),
};
