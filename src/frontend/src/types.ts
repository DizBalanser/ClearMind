export interface User {
    id: number;
    email: string;
    name: string;
    occupation?: string;
    goals?: Record<string, string>;
    personality?: Record<string, string>;
    life_areas?: string[];
    created_at?: string;
}

// Main categories: task, idea, thought
// Subcategories provide more specific classification
export type MainCategory = 'task' | 'idea' | 'thought';
export type TaskSubcategory = 'obligation' | 'goal' | 'habit' | 'deadline';
export type IdeaSubcategory = 'project' | 'creative' | 'improvement';
export type ThoughtSubcategory = 'reflection' | 'learning' | 'memory' | 'question';
export type Subcategory = TaskSubcategory | IdeaSubcategory | ThoughtSubcategory;

export interface Item {
    id: number;
    title: string;
    description?: string;
    category: MainCategory;
    subcategory?: Subcategory;
    life_area?: string;
    deadline?: string;
    priority: number;
    status: 'pending' | 'in_progress' | 'done' | 'archived';
    created_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}
