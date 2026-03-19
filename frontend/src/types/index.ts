export type UserRole = 'GUEST' | 'USER' | 'BUSINESS' | 'ADMIN';

export interface User {
    id: string;
    fullname: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    is_active: boolean;
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
    price?: number;
    rating_avg: number;
    status: 'ACTIVE' | 'INACTIVE';
    latitude: number;
    longitude: number;
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

export interface PostImage {
    id: number | null;
    post_id: string;
    image_url: string;
    order: number;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    images?: PostImage[];
    author_id: string;
    author_name: string;
    likes_count: number;
    comments_count: number;
    user_liked?: boolean;
    created_at: string;
    updated_at: string;
    comments?: Comment[];
}


export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    parent_id?: string;
    content: string;
    likes_count: number;
    user_liked?: boolean;
    replies?: Comment[];
    created_at: string;
}

export interface Like {
    id: number;
    post_id: string;
    user_id: string;
    created_at: string;
}

export interface Booking {
    id: string;
    business_registration_id: string;
    customer_user_id: string;
    customer_name: string;
    customer_phone: string;
    service_type: 'ROOM' | 'TABLE' | 'SEAT';
    booking_date: string;
    time_slot: string;
    guest_count: number;
    notes?: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    created_at: string;
    updated_at?: string;
    business?: {
        id: string;
        business_name: string;
        business_type: string;
        headquarters_address: string;
    };
    customer?: {
        id: string;
        fullname: string;
        email: string;
        phone?: string;
    };
}

export interface BusinessRegistration {
    id: string;
    user_id: string;
    business_name: string;
    tax_code: string;
    headquarters_address: string;
    representative_name: string;
    business_license_url: string;
    representative_id_front_url: string;
    representative_id_back_url: string;
    business_type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
    description?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_notes?: string;
    created_at: string;
    updated_at?: string;
    user?: User;
}
