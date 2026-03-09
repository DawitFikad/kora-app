export const resolveMediaUrl = (raw?: string | null): string => {
    if (!raw) return '';
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

    const apiBase = String(import.meta.env.VITE_API_BASE_URL || '/api');
    const baseWithoutApi = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;

    return baseWithoutApi ? `${baseWithoutApi}${normalizedPath}` : normalizedPath;
};
