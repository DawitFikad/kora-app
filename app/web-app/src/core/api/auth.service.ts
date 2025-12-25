import api from './client';

export const AuthService = {
    // Phase 1: OTP Request
    requestOtp: (phoneNumber: string) => api.post('/auth/otp/request', { phoneNumber }),

    // Phase 2: OTP Verification
    verifyOtp: (phoneNumber: string, otp: string) => api.post('/auth/otp/verify', { phoneNumber, otp }),

    // Phase 3: Registration (only if needed after verification)
    registerOrganizer: (data: { phoneNumber: string, email: string, name: string }) =>
        api.post('/auth/organizer/register', data),

    // Token Refresh
    refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),

    // Session status
    getMe: () => api.get('/auth/me').then(res => res as any),

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
    }
};
