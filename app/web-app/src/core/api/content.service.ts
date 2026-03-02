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

    addCategory: (name: string, slug: string, mainCategoryId?: number) => api.post<any, ApiResponse<any>>('/content/categories', { name, slug, mainCategoryId }),
    removeCategory: (id: number) => api.delete<any, ApiResponse<any>>(`/content/categories/${id}`),

    addCity: (name: string, slug: string) => api.post<any, ApiResponse<any>>('/content/cities', { name, slug }),
    removeCity: (id: number) => api.delete<any, ApiResponse<any>>(`/content/cities/${id}`),

    getBanners: (admin?: boolean) => api.get<any, ApiResponse<any[]>>(`/content/banners${admin ? '?admin=true' : ''}`),
    getBannerDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/banners/${id}`),
    addBanner: (data: any) => api.post<any, ApiResponse<any>>('/content/banners', data),
    updateBanner: (id: number, data: any) => api.put<any, ApiResponse<any>>(`/content/banners/${id}`, data),
    removeBanner: (id: number) => api.delete<any, ApiResponse<any>>(`/content/banners/${id}`),
};
