import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../api/auth.service';

interface AuthContextType {
    user: any;
    token: string | null;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const data = await AuthService.getMe();
                    setUser(data.user);
                } catch (error) {
                    console.error('Session expired');
                    logout();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const needsApprovalCheck = user?.status === 'PENDING'
            || user?.role === 'PENDING'
            || user?.role === 'ORGANIZER_PENDING'
            || user?.role === 'USER';

        if (!needsApprovalCheck) return;

        const interval = setInterval(async () => {
            try {
                const data = await AuthService.getMe();
                if (data?.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Failed to refresh session', error);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [token, user?.status, user?.role]);

    const login = async (data: { accessToken: string, user: any }) => {
        localStorage.setItem('token', data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
    };

    const logout = () => {
        AuthService.logout();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
