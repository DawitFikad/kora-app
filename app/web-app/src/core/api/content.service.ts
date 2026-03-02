import api from './client';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export const ContentService = {
    // Returns nested tree: parent categories with subCategories[]
    getCategories: () => api.get<any, ApiResponse<any[]>>('/content/categories'),
    // Returns all categories flat (for admin management)
    getAllCategoriesFlat: () => api.get<any, ApiResponse<any[]>>('/content/categories?flat=true'),
    getCategoryDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/categories/${id}`),
    getCities: () => api.get<any, ApiResponse<any[]>>('/content/cities'),
    getCityDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/cities/${id}`),

    // parentId optional: if provided, creates subcategory
    addCategory: (name: string, slug: string, parentId?: number) =>
        api.post<any, ApiResponse<any>>('/content/categories', { name, slug, parentId }),
    removeCategory: (id: number) => api.delete<any, ApiResponse<any>>(`/content/categories/${id}`),

    addCity: (name: string, slug: string) => api.post<any, ApiResponse<any>>('/content/cities', { name, slug }),
    removeCity: (id: number) => api.delete<any, ApiResponse<any>>(`/content/cities/${id}`),

    getBanners: (admin?: boolean) => api.get<any, ApiResponse<any[]>>(`/content/banners${admin ? '?admin=true' : ''}`),
    getBannerDetail: (id: number) => api.get<any, ApiResponse<any>>(`/content/banners/${id}`),
    addBanner: (data: any) => api.post<any, ApiResponse<any>>('/content/banners', data),
    updateBanner: (id: number, data: any) => api.put<any, ApiResponse<any>>(`/content/banners/${id}`, data),
    removeBanner: (id: number) => api.delete<any, ApiResponse<any>>(`/content/banners/${id}`),
};
