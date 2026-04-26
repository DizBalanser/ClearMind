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

// ============================================================================
// Phase 2 — Multi-Agent & New Features
// ============================================================================

export interface ScheduleBlock {
    item_id: number;
    title: string;
    estimated_duration_minutes: number;
    scheduled_start: string;
    scheduled_end: string;
}

export interface ReflectionSummary {
    summary: string;
    patterns: string[];
    suggestions: string[];
}

export interface AgentChatResponse {
    agent: string;
    message: string;
    items: Item[];
    schedule: ScheduleBlock[];
    reflection?: ReflectionSummary;
    memory_candidates?: MemoryCandidate[];
}

export interface GraphNode {
    id: number;
    title: string;
    description?: string | null;
    category: MainCategory;
    subcategory?: string;
    life_area?: string;
    status: string;
    tags?: string[];
    priority?: number;
    val: number; // node size based on priority
}

export type GraphLinkType = 'subtask_of' | 'relates_to' | 'blocks' | 'updates';

export interface GraphLink {
    id: number;
    source: number | GraphNode;
    target: number | GraphNode;
    source_id?: number;
    target_id?: number;
    link_type: GraphLinkType;
    weight?: number | null;
    ai_reasoning?: string | null;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface GraphAnalyzeResponse {
    suggested_links: GraphLink[];
    created_count: number;
    skipped_count: number;
}

export type ProfileMemoryCategory = 'identity' | 'constraint' | 'goal' | 'general';

export interface MemoryCandidate {
    category: ProfileMemoryCategory;
    fact: string;
    confidence: number;
    reason?: string | null;
}

export interface UserContextEntry {
    id: number;
    category: ProfileMemoryCategory;
    key: string;
    fact: string;
    source?: string | null;
    confidence?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface ProfileUpdateLog {
    id: number;
    category: ProfileMemoryCategory;
    fact: string;
    source?: string | null;
    confidence?: number | null;
    created_at?: string | null;
}

export interface UserProfileMemory {
    context: UserContextEntry[];
    updates: ProfileUpdateLog[];
}

export interface UserContextUpdatePayload {
    category: ProfileMemoryCategory;
    fact: string;
}

export interface UserContextCreatePayload extends UserContextUpdatePayload {
    source?: string;
    confidence?: number;
}

export interface ProfileQuestion {
    id: string;
    category: ProfileMemoryCategory;
    prompt: string;
    placeholder?: string | null;
}

export interface ProfileQuestionAnswer {
    question_id: string;
    category: ProfileMemoryCategory;
    fact: string;
}

export interface DashboardActivityDay {
    date: string;
    tasks: number;
    ideas: number;
    thoughts: number;
    total: number;
}

export interface DashboardVelocityPoint {
    date: string;
    nodes: number;
    connections: number;
}

export interface DashboardTelemetry {
    active_profile_rules: number;
    memory_updates: number;
    graph_connections: number;
    hidden_connections: number;
    pending_tasks: number;
    reflections: number;
}

export interface DashboardAnalytics {
    activity: DashboardActivityDay[];
    velocity: DashboardVelocityPoint[];
    telemetry: DashboardTelemetry;
}
