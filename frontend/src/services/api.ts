import axios from 'axios';
import type {
    Location,
    Category,
    Dish,
    ChatSession,
    ChatMessage,
    User,
    Review,
    Favorite,
    CostReference,
    SystemStatistic
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// API services
export const locationService = {
    getAll: () => api.get<Location[]>('/locations'),
    getById: (id: number) => api.get<Location>(`/locations/${id}`),
    create: (data: Partial<Location>) => api.post<Location>('/locations', data),
    update: (id: number, data: Partial<Location>) => api.put<Location>(`/locations/${id}`, data),
    delete: (id: number) => api.delete(`/locations/${id}`),
};

export const categoryService = {
    getAll: () => api.get<Category[]>('/categories'),
    getById: (id: number) => api.get<Category>(`/categories/${id}`),
};

export const dishService = {
    getAll: () => api.get<Dish[]>('/dishes'),
    getById: (id: number) => api.get<Dish>(`/dishes/${id}`),
};

export const authService = {
    login: (credentials: any) => api.post<{ token: string, user: User }>('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get<User>('/auth/me'),
};

export const chatService = {
    getSessions: () => api.get<ChatSession[]>('/chats'),
    getSessionMessages: (sessionId: number) => api.get<ChatMessage[]>(`/chats/${sessionId}/messages`),
    sendMessage: (sessionId: number, message: string) => api.post<ChatMessage>(`/chats/${sessionId}/messages`, { message }),
    createSession: (title: string) => api.post<ChatSession>('/chats', { title }),
};

export const interactionService = {
    getReviews: (locationId: number) => api.get<Review[]>(`/locations/${locationId}/reviews`),
    addReview: (locationId: number, data: any) => api.post<Review>(`/locations/${locationId}/reviews`, data),
    getFavorites: () => api.get<Favorite[]>('/favorites'),
    toggleFavorite: (locationId: number) => api.post(`/favorites/toggle`, { locationId }),
};

export const adminService = {
    getStats: () => api.get<SystemStatistic[]>('/admin/stats'),
    getUsers: () => api.get<User[]>('/admin/users'),
    updateCost: (id: number, data: Partial<CostReference>) => api.put(`/admin/costs/${id}`, data),
};

export default api;
