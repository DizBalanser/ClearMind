/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type {
    AuthResponse,
    User,
    Item,
    AgentChatResponse,
    ScheduleBlock,
    GraphData,
    GraphAnalyzeResponse,
    GraphLinkType,
    UserContextEntry,
    UserContextCreatePayload,
    UserContextUpdatePayload,
    UserProfileMemory,
    ProfileQuestion,
    ProfileQuestionAnswer,
    DashboardAnalytics,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

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
    send: async (message: string): Promise<AgentChatResponse> => {
        const { data } = await api.post('/chat', { message });
        return data;
    },
    getHistory: async (limit: number = 10): Promise<any[]> => {
        const { data } = await api.get('/chat/history', { params: { limit } });
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

// ============================================================================
// Phase 2 — Multi-Agent Services
// ============================================================================

export const schedule = {
    get: async (startDate?: string, endDate?: string): Promise<ScheduleBlock[]> => {
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const { data } = await api.get('/schedule', { params });
        return data;
    },
    updateBlock: async (itemId: number, updateData: Partial<ScheduleBlock>): Promise<ScheduleBlock> => {
        const { data } = await api.put(`/schedule/${itemId}`, updateData);
        return data;
    },
    exportIcs: async (): Promise<Blob> => {
        const response = await api.get('/schedule/export', { responseType: 'blob' });
        return response.data;
    },
};

export const graph = {
    getData: async (): Promise<GraphData> => {
        const { data } = await api.get('/graph');
        return {
            nodes: data.nodes ?? [],
            links: (data.links ?? []).map((link: any) => ({
                ...link,
                source: link.source ?? link.source_id,
                target: link.target ?? link.target_id,
            })),
        };
    },
    createLink: async (sourceId: number, targetId: number, linkType: GraphLinkType = 'relates_to'): Promise<any> => {
        const { data } = await api.post('/graph/links', {
            source_id: sourceId,
            target_id: targetId,
            link_type: linkType,
        });
        return data;
    },
    deleteLink: async (linkId: number): Promise<void> => {
        await api.delete(`/graph/links/${linkId}`);
    },
    analyze: async (): Promise<GraphAnalyzeResponse> => {
        const { data } = await api.post('/graph/analyze');
        return {
            ...data,
            suggested_links: (data.suggested_links ?? []).map((link: any) => ({
                ...link,
                source: link.source ?? link.source_id,
                target: link.target ?? link.target_id,
            })),
        };
    },
};

export const profileMemory = {
    get: async (): Promise<UserProfileMemory> => {
        const { data } = await api.get('/profile');
        return data;
    },
    createContext: async (payload: UserContextCreatePayload): Promise<UserContextEntry> => {
        const { data } = await api.post('/profile/context', payload);
        return data;
    },
    updateContext: async (id: number, payload: UserContextUpdatePayload): Promise<UserContextEntry> => {
        const { data } = await api.put(`/profile/context/${id}`, payload);
        return data;
    },
    deleteContext: async (id: number): Promise<void> => {
        await api.delete(`/profile/context/${id}`);
    },
    getQuestions: async (): Promise<ProfileQuestion[]> => {
        const { data } = await api.get('/profile/questions');
        return data;
    },
    submitQuestionnaire: async (answers: ProfileQuestionAnswer[]): Promise<UserContextEntry[]> => {
        const { data } = await api.post('/profile/questions', { answers });
        return data;
    },
};

export const dashboard = {
    getAnalytics: async (days: number = 60): Promise<DashboardAnalytics> => {
        const { data } = await api.get('/dashboard/analytics', { params: { days } });
        return data;
    },
};

export default api;
