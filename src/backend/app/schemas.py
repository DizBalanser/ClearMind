from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

# ============================================================================
# Authentication Schemas
# ============================================================================


class UserRegister(BaseModel):
    """Schema for user registration"""

    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str | None = None


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

    name: str | None = None
    occupation: str | None = None
    goals: dict[str, str] = Field(default_factory=dict)
    personality: dict[str, str] = Field(default_factory=dict)
    life_areas: list[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    """Schema for user response"""

    id: int
    email: str
    name: str | None
    occupation: str | None
    goals: dict
    personality: dict
    life_areas: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Item Schemas
# ============================================================================


class ItemCreate(BaseModel):
    """Schema for creating an item manually"""

    title: str
    description: str | None = None
    category: str  # task, idea, thought
    subcategory: str | None = None  # obligation, goal, habit, project, creative, etc.
    life_area: str | None = None
    deadline: datetime | None = None
    priority: int | None = None


class ItemUpdate(BaseModel):
    """Schema for updating an item"""

    title: str | None = None
    description: str | None = None
    category: str | None = None
    subcategory: str | None = None
    life_area: str | None = None
    deadline: datetime | None = None
    status: str | None = None
    priority: int | None = None


class ItemResponse(BaseModel):
    """Schema for item response"""

    id: int
    user_id: int
    title: str
    description: str | None
    category: str
    subcategory: str | None
    life_area: str | None
    deadline: datetime | None
    status: str
    priority: int | None
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
    agent_used: str | None = None
    timestamp: datetime

    class Config:
        from_attributes = True


class ClassifiedItem(BaseModel):
    """Schema for a classified item from AI"""

    title: str
    category: Literal["task", "idea", "thought"]
    subcategory: str | None = None
    life_area: str | None = None
    deadline: str | None = None  # ISO format string
    priority: int = Field(ge=1, le=10)
    description: str | None = None


class BrainDumpExtractedItem(BaseModel):
    """Strict LLM contract item from the Brain Dump & Memory Agent."""

    title: str
    category: Literal["task", "idea", "thought"]
    description: str = ""
    subcategory: str | None = None
    life_area: str | None = None
    deadline: str | None = None
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
    reason: str | None = None


class MemoryExtractionLLMResponse(BaseModel):
    """Strict JSON response for memory candidate extraction."""

    memory_candidates: list[MemoryCandidateResponse] = Field(default_factory=list)


class BrainDumpLLMResponse(BaseModel):
    """Strict JSON response for the Brain Dump & Memory Agent."""

    extracted_items: list[BrainDumpExtractedItem] = Field(default_factory=list)
    profile_updates: list[ProfileUpdatePayload] = Field(default_factory=list)


class UserContextResponse(BaseModel):
    """Current long-term memory fact shown in the profile UI."""

    id: int
    category: Literal["identity", "constraint", "goal", "general"]
    key: str
    fact: str
    source: str | None = None
    confidence: float | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserContextUpdate(BaseModel):
    """Payload for correcting an active long-term memory fact."""

    category: Literal["identity", "constraint", "goal", "general"]
    fact: str = Field(..., min_length=1)


class UserContextCreate(UserContextUpdate):
    """Payload for explicitly saving a new long-term memory fact."""

    source: str | None = "user"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class ProfileUpdateResponse(BaseModel):
    """Append-only memory extraction event shown in the profile feed."""

    id: int
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str
    source: str | None = None
    confidence: float | None = None
    created_at: datetime | None = None


class UserProfileMemoryResponse(BaseModel):
    """Current profile memory plus recent extraction log."""

    context: list[UserContextResponse] = Field(default_factory=list)
    updates: list[ProfileUpdateResponse] = Field(default_factory=list)


class ProfileQuestionResponse(BaseModel):
    """A guided question used to collect user-approved profile memory."""

    id: str
    category: Literal["identity", "constraint", "goal", "general"]
    prompt: str
    placeholder: str | None = None


class ProfileQuestionAnswer(BaseModel):
    """Reviewed questionnaire answer that can be stored as memory."""

    question_id: str
    category: Literal["identity", "constraint", "goal", "general"]
    fact: str = Field(..., min_length=1)


class ProfileQuestionnaireSubmit(BaseModel):
    """Batch payload for saving reviewed questionnaire answers."""

    answers: list[ProfileQuestionAnswer] = Field(default_factory=list)


class ChatResponse(BaseModel):
    """Schema for chat response with classified items"""

    message: str  # AI's response text
    items: list[ClassifiedItem]  # Classified items


# ============================================================================
# Phase 2 — Multi-Agent Response Schemas
# ============================================================================


class ScheduleBlock(BaseModel):
    """Schema for a scheduled time block from the Scheduler Agent"""

    item_id: int
    title: str
    estimated_duration_minutes: int
    scheduled_start: str  # ISO datetime
    scheduled_end: str  # ISO datetime


class ReflectionSummary(BaseModel):
    """Schema for reflection data from the Reflection/Planner Agent"""

    summary: str
    patterns: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class AgentChatResponse(BaseModel):
    """Schema for the unified multi-agent chat response"""

    agent: str  # which agent handled the request
    message: str  # AI's response text
    items: list[ClassifiedItem] = Field(default_factory=list)
    schedule: list[ScheduleBlock] = Field(default_factory=list)
    reflection: ReflectionSummary | None = None
    memory_candidates: list[MemoryCandidateResponse] = Field(default_factory=list)


class RouterLLMResponse(BaseModel):
    """Strict JSON response for the Orchestrator router."""

    agent: Literal["brain_dump", "reflection", "scheduler", "planner"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str = ""


class ReflectionLLMResponse(BaseModel):
    """Strict JSON response for the Reflection Agent."""

    conversational_response: str
    mental_state_summary: str
    patterns: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class SchedulerLLMResponse(BaseModel):
    """Strict JSON response for the Scheduler Agent."""

    summary: str
    schedule: list[ScheduleBlock] = Field(default_factory=list)


class PlannerLLMResponse(BaseModel):
    """Strict JSON response for the Planner Agent."""

    strategic_advice: str
    alignment_summary: str
    gap_analysis: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)


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
    weight: int | None = Field(default=None, ge=0, le=100)
    ai_reasoning: str | None = None

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

    suggested_links: list[GraphSuggestedLink] = Field(default_factory=list)


class GraphAnalyzeResponse(BaseModel):
    """Response returned after graph analysis creates or reuses links."""

    suggested_links: list[ItemLinkResponse] = Field(default_factory=list)
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

    activity: list[DashboardActivityDay] = Field(default_factory=list)
    velocity: list[DashboardVelocityPoint] = Field(default_factory=list)
    telemetry: DashboardTelemetry = Field(default_factory=DashboardTelemetry)


class GraphData(BaseModel):
    """Schema for the knowledge graph data"""

    nodes: list[dict]
    links: list[ItemLinkResponse]


class ScheduleUpdate(BaseModel):
    """Schema for updating a schedule block"""

    scheduled_start: str | None = None
    scheduled_end: str | None = None
    estimated_duration_minutes: int | None = None
