# System Specifications

## 1. Functional Requirements

Functional requirements are grouped by the core Phase 2 modules implemented in the current codebase.

## 1.1 Brain Dump Orchestrator Module

### FR-BO-01: Unified conversational intake
The system shall accept authenticated user messages and route them through a centralized orchestration layer.

### FR-BO-02: Intent-based agent delegation
The system shall classify interaction intent and delegate processing to the appropriate specialized agent (brain dump, scheduler, reflection, planner).

### FR-BO-03: Structured response payload
The system shall return a normalized API response containing message text and optional structured sections (classified items, schedule blocks, reflection summary, memory candidates).

### FR-BO-04: Conversation persistence
The system shall persist user and assistant messages for history retrieval.

### FR-BO-05: Memory candidate extraction
The system shall extract candidate long-term facts from conversation context and expose them for user approval.

## 1.2 Knowledge Graph Module

### FR-KG-01: Graph retrieval
The system shall provide item nodes and edge links for the authenticated user graph.

### FR-KG-02: Manual link management
The system shall allow users to create and delete links between valid owned items.

### FR-KG-03: AI-assisted graph analysis
The system shall analyze existing items and suggest or create high-confidence semantic links.

### FR-KG-04: Link integrity controls
The system shall reject invalid links (self-links, duplicates, or unauthorized cross-user items).

## 1.3 Global Profile Memory Module

### FR-PM-01: Active context retrieval
The system shall return a normalized view of current long-term context entries and recent profile update events.

### FR-PM-02: User-approved memory creation
The system shall allow explicit creation of context rules/facts by category.

### FR-PM-03: Questionnaire-based enrichment
The system shall accept guided question answers and transform valid answers into context entries.

### FR-PM-04: Context correction lifecycle
The system shall support update and deletion of existing context entries.

### FR-PM-05: Input validation
The system shall reject empty fact submissions and unknown context references with explicit HTTP errors.

## 2. Non-Functional Requirements

## 2.1 Performance

- NFR-P-01: API endpoints should return within interactive latency targets for non-LLM operations under normal local load.
- NFR-P-02: Frontend interactions should preserve smooth navigation without blocking on unrelated async operations.
- NFR-P-03: Coverage and lint checks should complete in CI with predictable runtime for every push to `main`.

## 2.2 Reliability

- NFR-R-01: The system shall provide deterministic fallback behavior when external AI services fail or timeout.
- NFR-R-02: Data writes shall be transactionally safe and user-scoped.
- NFR-R-03: Core backend logic shall be regression-tested via automated tests in CI.

## 2.3 Security

- NFR-S-01: Protected endpoints shall require token-based authentication.
- NFR-S-02: User data access shall be constrained to authenticated ownership checks.
- NFR-S-03: Sensitive configuration values shall remain outside committed source code (`.env` strategy).

## 2.4 Usability

- NFR-U-01: The UI shall provide clear status feedback for loading, success, empty-state, and failure paths.
- NFR-U-02: Navigation shall remain consistent across protected pages using shared layout components.
- NFR-U-03: For thesis presentation reliability, a controlled Demo Mode shall be available to avoid live dependency risk.

## 2.5 Maintainability

- NFR-M-01: Backend concerns shall remain modularized by route, service, and model boundaries.
- NFR-M-02: API contracts shall remain typed and documented through OpenAPI artifacts.
- NFR-M-03: Static analysis and formatting checks shall be automated in CI through `ruff`.

## 3. Traceability Mapping

| Requirement ID | Requirement Summary | Current Implementation Mapping |
|---|---|---|
| FR-BO-01 | Unified conversational intake | `src/backend/app/routes/chat.py` (`POST /chat`) |
| FR-BO-02 | Intent-based delegation | `src/backend/app/services/orchestrator.py` (`Orchestrator.route_and_execute`) |
| FR-BO-03 | Structured response payload | `src/backend/app/schemas.py` (`AgentChatResponse`, related models) |
| FR-BO-04 | Conversation persistence | `src/backend/app/models/message.py`, write operations in `routes/chat.py` |
| FR-BO-05 | Memory candidate extraction | `src/backend/app/services/profile_memory.py` (`extract_memory_candidates`) |
| FR-KG-01 | Graph retrieval | `src/backend/app/routes/graph.py` (`GET /graph`) |
| FR-KG-02 | Manual link management | `src/backend/app/routes/graph.py` (`POST /graph/links`, `DELETE /graph/links/{id}`) |
| FR-KG-03 | AI-assisted graph analysis | `src/backend/app/routes/graph.py` (`POST /graph/analyze`), `services/agents/graph_analyzer.py` |
| FR-KG-04 | Link integrity controls | duplicate/self/ownership checks in `routes/graph.py` |
| FR-PM-01 | Active context retrieval | `src/backend/app/routes/profile.py` (`GET /profile`) |
| FR-PM-02 | User-approved memory creation | `src/backend/app/routes/profile.py` (`POST /profile/context`) |
| FR-PM-03 | Questionnaire enrichment | `src/backend/app/routes/profile.py` (`GET/POST /profile/questions`) |
| FR-PM-04 | Context correction lifecycle | `src/backend/app/routes/profile.py` (`PUT/DELETE /profile/context/{id}`) |
| FR-PM-05 | Input validation | explicit empty-fact and not-found checks in `routes/profile.py` |
| NFR-R-03 | Automated regression checks | `src/backend/tests/`, `.github/workflows/ci.yml`, `src/backend/pyproject.toml` |
| NFR-M-02 | API contract documentation | FastAPI schema + `src/backend/scripts/export_api_docs.py` output to `docs/api/` |
| Req: Store Long-Term Facts | Persist durable user context | `src/backend/app/models/user_context.py` (`UserContext` table/model) |
| Req: Audit Memory Evolution | Persist memory update history | `src/backend/app/models/profile_update.py` (`ProfileUpdate`) |
| Req: Persist Graph Relations | Store semantic item links | `src/backend/app/models/item_link.py` (`ItemLink`) |

## 4. Specification Conclusion

The current Phase 2 implementation satisfies the core functional goals for orchestration, graph intelligence, and long-term profile memory. Remaining Milestone 4 effort is primarily quality hardening (final Demo Mode behavior, expanded CI evidence, and final thesis packaging), rather than foundational architecture changes.
