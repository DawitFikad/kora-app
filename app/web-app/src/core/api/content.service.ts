import api from './client';

export const ContentService = {
    getCategories: () => api.get('/content/categories'),
    getCategoryDetail: (id: number) => api.get(`/content/categories/${id}`),
    getCities: () => api.get('/content/cities'),
    getCityDetail: (id: number) => api.get(`/content/cities/${id}`),

    addCategory: (name: string, slug: string) => api.post('/content/categories', { name, slug }),
    removeCategory: (id: number) => api.delete(`/content/categories/${id}`),

    addCity: (name: string, slug: string) => api.post('/content/cities', { name, slug }),
    removeCity: (id: number) => api.delete(`/content/cities/${id}`),
};
