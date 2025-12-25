import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'var(--bg)'
            }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (!user) {
        console.log('ProtectRoute: No user, redirecting');
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log('ProtectRoute: Role mismatch', { userRole: user.role, allowedRoles });
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
