# Backend Overview (Milestone 2)

This document summarizes the backend architecture and data flow for ClearMind Phase 2.

## Stack

- Framework: FastAPI
- ORM: SQLAlchemy
- Validation: Pydantic
- Database: SQLite (development)
- AI integration: Gemini API via structured JSON helper

## Entry Point

- Application entry: `src/backend/app/main.py`
- Core setup includes:
  - settings loading (`config.py`)
  - database initialization (`database.py`)
  - router registration for all API domains

## API Route Modules

- `auth.py` - register/login
- `users.py` - user profile operations
- `items.py` - CRUD for life database items
- `chat.py` - main chat endpoint and history
- `schedule.py` - schedule generation and export
- `graph.py` - knowledge graph links and analysis
- `profile.py` - profile memory and context management
- `dashboard.py` - analytics aggregation

## Service Layer

- `orchestrator.py`
  - routes chat intent to specialized agent modules
  - normalizes response payloads for API layer
- `profile_memory.py`
  - extracts memory candidates from conversation
  - persists profile updates and user context entries
- `llm_json.py`
  - shared adapter for structured LLM JSON responses

### Agent Modules

Located in `src/backend/app/services/agents/`:
- `brain_dump.py`
- `reflection.py`
- `scheduler.py`
- `planner.py`
- `graph_analyzer.py`

## Data Model Layer

Core SQLAlchemy models in `src/backend/app/models/`:
- `user.py`
- `item.py`
- `item_link.py`
- `message.py`
- `conversation.py`
- `reflection.py`
- `profile_update.py`
- `user_context.py`

These models support:
- user identity and auth-bound data ownership
- item and relationship graph storage
- chat history and reflection outputs
- long-term profile memory

## Data Flow (High Level)

1. Frontend calls `/api/*` endpoint.
2. Route validates auth/session and request payload.
3. Route calls service layer (orchestrator/agents/profile memory).
4. Services query/update SQLAlchemy models.
5. When needed, services call LLM through `llm_json.py`.
6. Route returns typed response schema to frontend.

## Testing Coverage (Current)

Current backend tests are in `src/backend/tests/`:
- `test_llm_json.py`
- `test_profile_memory.py`
- `test_dashboard_analytics.py`

This provides baseline functional coverage for structured LLM parsing, memory behavior, and analytics logic.
