# Methodology Draft (Milestone 3)

## 1. Research and Design Approach

The project follows an iterative prototype methodology designed for applied AI systems:

1. Requirement-driven milestone planning.
2. Modular architecture definition (frontend, backend, memory, reasoning).
3. Incremental implementation with continuous validation.
4. Documentation updates aligned with each milestone.

This approach supports rapid delivery while preserving traceability between requirements, implementation artifacts, and evaluation results.

## 2. System Development Method

The implementation is organized into three technical layers:

- Presentation layer: React + TypeScript + Tailwind interface.
- Service layer: FastAPI endpoints, orchestration logic, and domain services.
- Data and memory layer: SQLAlchemy models and persistence for user context.

A modular multi-agent pattern is used in backend orchestration to route requests to specialized capabilities (brain-dump extraction, scheduling, reflection, graph analysis).

## 3. Data and Interaction Pipeline

The core operational cycle:

1. User submits natural-language input in chat.
2. Backend authenticates request and loads user context.
3. Orchestrator classifies intent and delegates to the relevant agent/service.
4. Structured output is generated and mapped to response schemas.
5. Optional memory candidates are extracted and persisted after confirmation.
6. UI renders response artifacts (message, items, schedule, reflection).

This pipeline is designed to reduce cognitive overhead by transforming unstructured thoughts into actionable structures.

## 4. Personalization Method

Personalization is based on explicit and implicit memory:

- Explicit memory: user-created or user-confirmed profile facts.
- Implicit memory: extracted contextual facts from interaction history.

Memory entries are categorized (identity, constraints, goals, general context) and reused in future reasoning prompts to improve relevance and continuity.

## 5. Validation Strategy

Milestone 3 validation combines:

- Functional validation of key flows (chat, memory, schedule, database, dashboard).
- API contract validation via typed schemas.
- Unit tests on critical backend logic (structured LLM parsing, memory persistence, analytics aggregation).
- Manual exploratory testing for UI quality, navigation, and error handling.

## 6. External API Reliability Method

Because the system integrates third-party LLM APIs, the testing strategy separates:

- Internal logic tests (deterministic, mock-friendly).
- Live integration checks (manual/controlled environment).

This reduces instability due to rate limits, network variability, and provider response changes.

## 7. Limitations of Current Methodology

- Automated coverage reporting is not yet fully integrated into a CI gate.
- UI visual consistency is validated manually rather than through snapshot regression.
- User studies are not yet statistically significant at this milestone.

## 8. Transition to Milestone 4

The next methodology phase will focus on:

- stronger CI/CD enforcement (test + coverage gates),
- broader scenario-based validation,
- and final documentation hardening for thesis submission.
