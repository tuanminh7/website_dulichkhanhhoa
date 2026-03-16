import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireBusiness?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireBusiness = false }) => {
    const { user, loading, isAdmin, isBusiness } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
                    <p className="mt-6 text-gray-500 font-bold uppercase tracking-widest text-xs">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (requireBusiness && !isBusiness && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
