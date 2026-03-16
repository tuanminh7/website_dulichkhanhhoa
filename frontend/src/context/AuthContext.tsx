import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
    updateUser: (newUser: User) => void;
    isAdmin: boolean;
    isBusiness: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (active) {
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await authService.getMe();
                if (active) {
                    setUser(res.data);
                }
            } catch (error) {
                localStorage.removeItem('token');
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        const handleAuthExpired = () => {
            localStorage.removeItem('token');
            if (active) setUser(null);
            navigate('/login', { state: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' } });
        };
        window.addEventListener('auth:expired', handleAuthExpired);

        return () => {
            active = false;
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, []);

    const login = async (credentials: any) => {
        const res = await authService.login(credentials);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };
    
    const updateUser = (newUser: User) => {
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            updateUser,
            isAdmin: user?.role === 'ADMIN',
            isBusiness: user?.role === 'BUSINESS',
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
