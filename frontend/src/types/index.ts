export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

export interface User {
    id: string;
    fullname: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    created_at: string;
}

export type CategoryType = 'ATTRACTION' | 'FOOD' | 'STAY';

export interface Category {
    id: number;
    name: string;
    icon?: string;
    type: CategoryType;
}

export interface LocationImage {
    id: number;
    location_id: number;
    image_url: string;
    is_primary: boolean;
}

export interface OpeningHour {
    id: number;
    location_id: number;
    day_of_week: number; // 0-6
    open_time: string; // HH:mm
    close_time: string; // HH:mm
}

export interface Location {
    id: number;
    category_id: number;
    name: string;
    description?: string;
    address?: string;
    price_range_min?: number;
    price_range_max?: number;
    rating_avg: number;
    status: 'ACTIVE' | 'INACTIVE';
    path?: any;
    map_url?: string;
    category?: Category;
    images?: LocationImage[];
    opening_hours?: OpeningHour[];
}

export interface Review {
    id: number;
    user_id: string;
    location_id: number;
    rating: number; // 1-5
    comment?: string;
    images?: string[];
    created_at: string;
    user?: User;
}

export interface Favorite {
    id: number;
    user_id: string;
    location_id: number;
    created_at: string;
    location?: Location;
}

export interface SavedItinerary {
    id: number;
    user_id: string;
    title: string;
    total_budget?: number;
    nodes: any;
    created_at: string;
}

export interface ChatSession {
    id: number;
    user_id?: string;
    title?: string;
    started_at: string;
}

export interface ChatMessage {
    id: number;
    session_id: number;
    sender_type: 'USER' | 'AI';
    message_content: string;
    created_at: string;
}

export interface CostReference {
    id: number;
    item_name: string;
    average_price: number;
    unit?: string;
    updated_at: string;
}

export interface Dish {
    id: number;
    name: string;
    description?: string;
    image_url?: string;
}

export interface SystemStatistic {
    id: number;
    date: string;
    total_users: number;
    total_chats: number;
    total_locations: number;
    most_visited_location_id?: number;
    most_visited_locations?: any[];
}
