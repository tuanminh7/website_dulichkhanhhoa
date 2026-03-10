import axios from 'axios';
import { triggerLoading } from '../context/LoadingContext';
import type {
    Location,
    Category,
    Dish,
    ChatSession,
    ChatMessage,
    User,
    Review,
    Favorite,
    Post,
    Comment as PostComment,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to show loading
api.interceptors.request.use(
    (config) => {
        triggerLoading(true);
        return config;
    },
    (error) => {
        triggerLoading(false);
        return Promise.reject(error);
    }
);

// Response interceptor to hide loading
api.interceptors.response.use(
    (response) => {
        triggerLoading(false);
        return response;
    },
    (error) => {
        triggerLoading(false);
        return Promise.reject(error);
    }
);

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
    getAll: (params?: any) => api.get<{ places: Location[], total: number, pages: number, current_page: number }>('/locations', { params }),
    getById: (id: number) => api.get<Location>(`/locations/${id}`),
    create: (data: any) => api.post<Location>('/locations', data),
    update: (id: number, data: any) => api.put<Location>(`/locations/${id}`, data),
    delete: (id: number) => api.delete(`/locations/${id}`),
};

export const categoryService = {
    getAll: () => api.get<Category[]>('/locations/categories'),
    getById: (id: number) => api.get<Category>(`/locations/categories/${id}`),
    create: (data: Partial<Category>) => api.post<Category>('/locations/categories', data),
    update: (id: number, data: Partial<Category>) => api.put<Category>(`/locations/categories/${id}`, data),
    delete: (id: number) => api.delete(`/locations/categories/${id}`),
};

export const dishService = {
    getAll: () => api.get<Dish[]>('/locations/dishes'),
    getById: (id: number) => api.get<Dish>(`/locations/dishes/${id}`),
};

export const authService = {
    login: (credentials: any) => api.post<{ token: string, user: User }>('/auth/login', credentials, { withCredentials: true }),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get<User>('/auth/me'),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    logout: () => api.post('/auth/logout'),
};

export const chatService = {
    getSessions: () => api.get<ChatSession[]>('/ai/sessions'),
    getSessionMessages: (sessionId: number) => api.get<ChatMessage[]>(`/ai/sessions/${sessionId}/messages`),
    sendMessage: (sessionId: number, message: string) => api.post<{ response: string, session_id: number, ai_message: ChatMessage }>('/ai/chat', { session_id: sessionId, message }),
    createSession: (title: string) => api.post<ChatSession>('/ai/sessions', { title }),
};

export const interactionService = {
    getReviews: (locationId: number) => api.get<Review[]>(`/locations/${locationId}/reviews`),
    addReview: (locationId: number, data: any) => api.post<Review>(`/locations/${locationId}/reviews`, data),
    getFavorites: () => api.get<Favorite[]>('/favorites'),
    toggleFavorite: (locationId: number) => api.post(`/favorites/toggle`, { locationId }),
};

export const newsService = {
    getAll: (params?: any) => api.get<{ posts: Post[], total: number, pages: number, current_page: number }>('/news', { params }),
    getById: (id: string) => api.get<Post>(`/news/${id}`),
    create: (data: any) => api.post<Post>('/news', data),
    addComment: (postId: string, content: string) => api.post<PostComment>(`/news/${postId}/comment`, { content }),
    toggleLike: (postId: string) => api.post<{ message: string, liked: boolean }>(`/news/${postId}/like`),
};

export const adminService = {
    getStats: () => api.get<any>('/admin/dashboard'),
    getUsers: (params?: any) => api.get<any>('/admin/users', { params }),
    toggleUserActive: (userId: string) => api.post(`/admin/users/${userId}/toggle-active`),
    makeAdmin: (userId: string) => api.post(`/admin/users/${userId}/make-admin`),
    getAnalytics: () => api.get<any>('/admin/analytics'),
    // updateCost: (id: number, data: Partial<CostReference>) => api.put(`/admin/costs/${id}`, data),
};

export default api;
