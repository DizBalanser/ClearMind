from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional, List, Dict
from datetime import date, datetime


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


# ============================================================================
# User Schemas
# ============================================================================

class UserProfile(BaseModel):
    """Schema for user profile data"""
    name: Optional[str] = None
    occupation: Optional[str] = None
    goals: Dict[str, str] = Field(default_factory=dict)
    personality: Dict[str, str] = Field(default_factory=dict)
    life_areas: List[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    name: Optional[str]
    occupation: Optional[str]
    goals: Dict
    personality: Dict
    life_areas: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Item Schemas
# ============================================================================

class ItemCreate(BaseModel):
    """Schema for creating an item manually"""
    title: str
    description: Optional[str] = None
    category: str  # task, idea, thought
    subcategory: Optional[str] = None  # obligation, goal, habit, project, creative, etc.
    life_area: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[int] = None


class ItemUpdate(BaseModel):
    """Schema for updating an item"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    life_area: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None


class ItemResponse(BaseModel):
    """Schema for item response"""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    category: str
    subcategory: Optional[str]
    life_area: Optional[str]
    deadline: Optional[datetime]
    status: str
    priority: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Chat Schemas
# ============================================================================

class ChatMessage(BaseModel):
    """Schema for incoming chat message"""
    message: str


class MessageResponse(BaseModel):
    """Schema for returning a single chat message from history"""
    id: int
    role: str
    content: str
    agent_used: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True



class ClassifiedItem(BaseModel):
    """Schema for a classified item from AI"""
    title: str
    category: Literal["task", "idea", "thought"]
    subcategory: Optional[str] = None
    life_area: Optional[str] = None
    deadline: Optional[str] = None  # ISO format string
    priority: int = Field(ge=1, le=10)
    description: Optional[str] = None


class BrainDumpExtractedItem(BaseModel):
    """Strict LLM contract item from the Brain Dump & Memory Agent."""
    title: str
    category: Literal["task", "idea", "thought"]
    description: str = ""
    subcategory: Optional[str] = None
    life_area: Optional[str] = None
    deadline: Optional[str] = None
    priority: int = Field(default=5, ge=1, le=10)


class ProfileUpdatePayload(BaseModel):
    """Long-term profile fact extracted from a user message."""
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str


class MemoryCandidateResponse(BaseModel):
    """Unsaved long-term fact candidate that needs user confirmation."""
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    reason: Optional[str] = None


class MemoryExtractionLLMResponse(BaseModel):
    """Strict JSON response for memory candidate extraction."""
    memory_candidates: List[MemoryCandidateResponse] = Field(default_factory=list)


class BrainDumpLLMResponse(BaseModel):
    """Strict JSON response for the Brain Dump & Memory Agent."""
    extracted_items: List[BrainDumpExtractedItem] = Field(default_factory=list)
    profile_updates: List[ProfileUpdatePayload] = Field(default_factory=list)


class UserContextResponse(BaseModel):
    """Current long-term memory fact shown in the profile UI."""
    id: int
    category: Literal["identity", "constraint", "goal", "general"]
    key: str
    fact: str
    source: Optional[str] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserContextUpdate(BaseModel):
    """Payload for correcting an active long-term memory fact."""
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str = Field(..., min_length=1)


class UserContextCreate(UserContextUpdate):
    """Payload for explicitly saving a new long-term memory fact."""
    source: Optional[str] = "user"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class ProfileUpdateResponse(BaseModel):
    """Append-only memory extraction event shown in the profile feed."""
    id: int
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str
    source: Optional[str] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None


class UserProfileMemoryResponse(BaseModel):
    """Current profile memory plus recent extraction log."""
    context: List[UserContextResponse] = Field(default_factory=list)
    updates: List[ProfileUpdateResponse] = Field(default_factory=list)


class ProfileQuestionResponse(BaseModel):
    """A guided question used to collect user-approved profile memory."""
    id: str
    category: Literal["identity", "constraint", "goal", "general"]
    prompt: str
    placeholder: Optional[str] = None


class ProfileQuestionAnswer(BaseModel):
    """Reviewed questionnaire answer that can be stored as memory."""
    question_id: str
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str = Field(..., min_length=1)


class ProfileQuestionnaireSubmit(BaseModel):
    """Batch payload for saving reviewed questionnaire answers."""
    answers: List[ProfileQuestionAnswer] = Field(default_factory=list)


class ChatResponse(BaseModel):
    """Schema for chat response with classified items"""
    message: str  # AI's response text
    items: List[ClassifiedItem]  # Classified items


# ============================================================================
# Phase 2 — Multi-Agent Response Schemas
# ============================================================================

class ScheduleBlock(BaseModel):
    """Schema for a scheduled time block from the Scheduler Agent"""
    item_id: int
    title: str
    estimated_duration_minutes: int
    scheduled_start: str  # ISO datetime
    scheduled_end: str    # ISO datetime


class ReflectionSummary(BaseModel):
    """Schema for reflection data from the Reflection/Planner Agent"""
    summary: str
    patterns: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


class AgentChatResponse(BaseModel):
    """Schema for the unified multi-agent chat response"""
    agent: str  # which agent handled the request
    message: str  # AI's response text
    items: List[ClassifiedItem] = Field(default_factory=list)
    schedule: List[ScheduleBlock] = Field(default_factory=list)
    reflection: Optional[ReflectionSummary] = None
    memory_candidates: List[MemoryCandidateResponse] = Field(default_factory=list)


class RouterLLMResponse(BaseModel):
    """Strict JSON response for the Orchestrator router."""
    agent: Literal["brain_dump", "reflection", "scheduler", "planner"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str = ""


class ReflectionLLMResponse(BaseModel):
    """Strict JSON response for the Reflection Agent."""
    conversational_response: str
    mental_state_summary: str
    patterns: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


class SchedulerLLMResponse(BaseModel):
    """Strict JSON response for the Scheduler Agent."""
    summary: str
    schedule: List[ScheduleBlock] = Field(default_factory=list)


class PlannerLLMResponse(BaseModel):
    """Strict JSON response for the Planner Agent."""
    strategic_advice: str
    alignment_summary: str
    gap_analysis: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)


class ItemLinkCreate(BaseModel):
    """Schema for creating a link between two items"""
    source_id: int
    target_id: int
    link_type: Literal["subtask_of", "relates_to", "blocks", "updates"] = "relates_to"


class ItemLinkResponse(BaseModel):
    """Schema for item link response"""
    id: int
    source_id: int
    target_id: int
    link_type: Literal["subtask_of", "relates_to", "blocks", "updates"]
    weight: Optional[int] = Field(default=None, ge=0, le=100)
    ai_reasoning: Optional[str] = None

    class Config:
        from_attributes = True


class GraphSuggestedLink(BaseModel):
    """Strict LLM contract for a graph edge suggestion."""
    source_id: int
    target_id: int
    link_type: Literal["subtask_of", "relates_to", "blocks", "updates"]
    weight: int = Field(ge=0, le=100)
    ai_reasoning: str


class GraphAnalyzerLLMResponse(BaseModel):
    """Strict JSON response from the Graph Analyzer Agent."""
    suggested_links: List[GraphSuggestedLink] = Field(default_factory=list)


class GraphAnalyzeResponse(BaseModel):
    """Response returned after graph analysis creates or reuses links."""
    suggested_links: List[ItemLinkResponse] = Field(default_factory=list)
    created_count: int = 0
    skipped_count: int = 0


class DashboardActivityDay(BaseModel):
    """Daily cognitive input volume by item category."""
    date: date
    tasks: int = 0
    ideas: int = 0
    thoughts: int = 0
    total: int = 0


class DashboardVelocityPoint(BaseModel):
    """Cumulative knowledge graph growth for a day."""
    date: date
    nodes: int = 0
    connections: int = 0


class DashboardTelemetry(BaseModel):
    """High-level agent and knowledge system metrics."""
    active_profile_rules: int = 0
    memory_updates: int = 0
    graph_connections: int = 0
    hidden_connections: int = 0
    pending_tasks: int = 0
    reflections: int = 0


class DashboardAnalyticsResponse(BaseModel):
    """Dashboard analytics payload for the premium command center."""
    activity: List[DashboardActivityDay] = Field(default_factory=list)
    velocity: List[DashboardVelocityPoint] = Field(default_factory=list)
    telemetry: DashboardTelemetry = Field(default_factory=DashboardTelemetry)


class GraphData(BaseModel):
    """Schema for the knowledge graph data"""
    nodes: List[dict]
    links: List[ItemLinkResponse]


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule block"""
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
