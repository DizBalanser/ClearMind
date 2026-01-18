import axios from 'axios';
import type { AuthResponse, User, Item } from '../types';

const API_BASE = '/api';

// Create axios instance with interceptor for JWT
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const auth = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/login', { email, password });
        return data;
    },
    register: async (userData: Partial<User> & { password: string }): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/register', userData);
        return data;
    },
    getMe: async (): Promise<User> => {
        const { data } = await api.get('/users/me');
        return data;
    },
    updateProfile: async (profileData: Partial<User>): Promise<User> => {
        const { data } = await api.put('/users/me', profileData);
        return data;
    },
};

export const chat = {
    send: async (message: string): Promise<any> => {
        const { data } = await api.post('/chat', { message });
        return data;
    },
};

export const items = {
    getAll: async (filters?: any): Promise<Item[]> => {
        const { data } = await api.get('/items', { params: filters });
        return data;
    },
    create: async (itemData: Partial<Item>): Promise<Item> => {
        const { data } = await api.post('/items', itemData);
        return data;
    },
    update: async (id: number, itemData: Partial<Item>): Promise<Item> => {
        const { data } = await api.put(`/items/${id}`, itemData);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/items/${id}`);
    },
    updateStatus: async (id: number, status: string): Promise<Item> => {
        const { data } = await api.patch(`/items/${id}/status`, { status });
        return data;
    },
};

export default api;
