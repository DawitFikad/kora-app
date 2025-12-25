import api from './client';

export const ContentService = {
    getCategories: () => api.get('/content/categories'),
    getCities: () => api.get('/content/cities'),

    addCategory: (name: string, slug: string) => api.post('/content/categories', { name, slug }),
    removeCategory: (id: number) => api.delete(`/content/categories/${id}`),

    addCity: (name: string, slug: string) => api.post('/content/cities', { name, slug }),
    removeCity: (id: number) => api.delete(`/content/cities/${id}`),
};
