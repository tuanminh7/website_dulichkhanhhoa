import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
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
const DEFAULT_CACHE_TTL = 60_000;
const AUTH_CACHE_TTL = 30_000;

const api = axios.create({
    baseURL: API_BASE_URL,
});

const responseCache = new Map<string, { expiresAt: number; response: AxiosResponse }>();
const inflightRequests = new Map<string, Promise<AxiosResponse>>();

const buildCacheKey = (method: string, url: string, config?: AxiosRequestConfig) => {
    const normalizedParams = config?.params ? JSON.stringify(config.params) : '';
    return `${method.toUpperCase()}:${url}:${normalizedParams}`;
};

const invalidateCache = (matcher: string | RegExp) => {
    for (const key of responseCache.keys()) {
        const matched = typeof matcher === 'string' ? key.includes(matcher) : matcher.test(key);
        if (matched) {
            responseCache.delete(key);
        }
    }

    for (const key of inflightRequests.keys()) {
        const matched = typeof matcher === 'string' ? key.includes(matcher) : matcher.test(key);
        if (matched) {
            inflightRequests.delete(key);
        }
    }
};

const getCached = async <T>(url: string, config?: AxiosRequestConfig, ttl = DEFAULT_CACHE_TTL): Promise<AxiosResponse<T>> => {
    const cacheKey = buildCacheKey('GET', url, config);
    const now = Date.now();
    const cachedEntry = responseCache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > now) {
        return cachedEntry.response as AxiosResponse<T>;
    }

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
        return inflight as Promise<AxiosResponse<T>>;
    }

    const request = api.get<T>(url, config)
        .then((response) => {
            responseCache.set(cacheKey, {
                expiresAt: now + ttl,
                response,
            });
            inflightRequests.delete(cacheKey);
            return response;
        })
        .catch((error) => {
            inflightRequests.delete(cacheKey);
            throw error;
        });

    inflightRequests.set(cacheKey, request as Promise<AxiosResponse>);
    return request;
};

api.interceptors.request.use(
    (config) => {
        triggerLoading(true);

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        triggerLoading(false);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        triggerLoading(false);
        return response;
    },
    (error) => {
        triggerLoading(false);
        if (error?.response?.status === 401) {
            invalidateCache('GET:/auth/me:');
        }
        return Promise.reject(error);
    }
);

export const locationService = {
    getAll: (params?: Record<string, unknown>) => getCached<Location[] | { places: Location[] }>('/locations', { params }).then((response) => ({
        ...response,
        data: Array.isArray(response.data) ? response.data : (response.data.places ?? []),
    })),
    getById: (id: number) => getCached<Location>(`/locations/${id}`),
    create: async (data: FormData | Record<string, unknown>) => {
        const response = await api.post<{ message: string; place: Location }>('/locations', data);
        invalidateCache(/GET:\/locations/);
        return response;
    },
    update: async (id: number, data: FormData | Record<string, unknown>) => {
        const response = await api.put<{ message: string; place: Location }>(`/locations/${id}`, data);
        invalidateCache(/GET:\/locations/);
        return response;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/locations/${id}`);
        invalidateCache(/GET:\/locations/);
        return response;
    },
};

export const categoryService = {
    getAll: () => getCached<Category[]>('/locations/categories'),
    getById: (id: number) => getCached<Category>(`/locations/categories/${id}`),
    create: async (data: Partial<Category>) => {
        const response = await api.post<Category>('/locations/categories', data);
        invalidateCache(/GET:\/locations\/categories/);
        invalidateCache(/GET:\/locations/);
        return response;
    },
    update: async (id: number, data: Partial<Category>) => {
        const response = await api.put<Category>(`/locations/categories/${id}`, data);
        invalidateCache(/GET:\/locations\/categories/);
        invalidateCache(/GET:\/locations/);
        return response;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/locations/categories/${id}`);
        invalidateCache(/GET:\/locations\/categories/);
        invalidateCache(/GET:\/locations/);
        return response;
    },
};

export const dishService = {
    getAll: () => getCached<Dish[]>('/dishes'),
    getById: (id: number) => getCached<Dish>(`/dishes/${id}`),
};

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post<{ token: string, user: User }>('/auth/login', credentials, { withCredentials: true });
        invalidateCache('GET:/auth/me:');
        return response;
    },
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => getCached<User>('/auth/me', undefined, AUTH_CACHE_TTL),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    logout: async () => {
        const response = await api.post('/auth/logout');
        invalidateCache('GET:/auth/me:');
        return response;
    },
};

export const chatService = {
    getSessions: () => getCached<ChatSession[]>('/ai/sessions'),
    getSessionMessages: (sessionId: number) => getCached<ChatMessage[]>(`/ai/sessions/${sessionId}/messages`),
    sendMessage: (sessionId: number, message: string) => api.post<{ response: string, session_id: number, ai_message: ChatMessage }>('/ai/chat', { session_id: sessionId, message }),
    createSession: (title: string) => api.post<ChatSession>('/ai/sessions', { title }),
};

export const interactionService = {
    getReviews: (locationId: number) => getCached<Review[]>(`/locations/${locationId}/reviews`),
    addReview: async (locationId: number, data: any) => {
        const response = await api.post<Review>(`/locations/${locationId}/reviews`, data);
        invalidateCache(`GET:/locations/${locationId}/reviews`);
        invalidateCache(`GET:/locations/${locationId}:`);
        invalidateCache(/GET:\/locations:/);
        return response;
    },
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
    getStats: () => getCached<any>('/admin/dashboard'),
    getUsers: (params?: any) => getCached<any>('/admin/users', { params }),
    toggleUserActive: async (userId: string) => {
        const response = await api.post(`/admin/users/${userId}/toggle-active`);
        invalidateCache('/admin/users');
        invalidateCache('/admin/dashboard');
        return response;
    },
    makeAdmin: async (userId: string) => {
        const response = await api.post(`/admin/users/${userId}/make-admin`);
        invalidateCache('/admin/users');
        invalidateCache('/admin/dashboard');
        return response;
    },
    getAnalytics: () => getCached<any>('/admin/analytics'),
};

export default api;
