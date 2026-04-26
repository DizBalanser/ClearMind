# ClearMind Final User Manual

## 1. Purpose

ClearMind is a Personal Digital Twin Assistant designed to support productivity and self-management through conversational interaction, memory-aware personalization, and multi-agent reasoning. This manual describes how to use the final prototype for normal operation and thesis demonstration.

## 2. System Access

### 2.1 Prerequisites
- Backend service running at `http://localhost:8000`
- Frontend service running at `http://localhost:5173`
- Valid user account for authenticated features

### 2.2 Authentication Flow
1. Open the landing page (`/`).
2. Register or sign in via the authentication modal.
3. After successful authentication, access protected modules through the sidebar navigation.

## 3. Main Application Modules

## 3.1 Dashboard
Purpose:
- Monitor telemetry and activity trends.
- Access summary-level progress indicators.

Typical actions:
- Review cognitive analytics cards.
- Inspect activity heatmap and trend sections.
- Navigate to chat for direct interaction.

## 3.2 Chat (Multi-Agent Core)
Purpose:
- Capture unstructured thoughts and transform them into structured outputs.

Typical actions:
- Submit a natural-language message.
- Review returned outputs (items, schedule suggestions, reflections).
- Accept or ignore memory candidates.

Expected behavior:
- If backend or model processing fails, a safe fallback message is shown.

## 3.3 My Life Database
Purpose:
- Maintain structured entities categorized as tasks, ideas, and thoughts.

Typical actions:
- Create, edit, and delete entries.
- Filter by category, status, and subcategory.
- Switch between list and graph-oriented views.

## 3.4 Schedule View
Purpose:
- Visualize scheduled blocks generated from planning workflows.

Typical actions:
- Review time blocks grouped by date.
- Export schedule to `.ics` for calendar integration.

## 3.5 User Profile Memory
Purpose:
- Curate long-term context facts used by the assistant for personalization.

Typical actions:
- Add or edit context facts by category.
- Submit questionnaire answers.
- Review profile update history.

## 4. Error Handling and Recovery

The system is designed to preserve usability under common faults:
- Invalid user input is rejected with explicit feedback.
- Missing data states are rendered with actionable empty-state guidance.
- External model/API failures do not crash the UI; fallback responses are provided.

## 5. Security and Data Scope

- Protected endpoints require valid authentication tokens.
- User data access is scoped to the authenticated account.
- Sensitive runtime secrets are managed through `.env` configuration and not hardcoded in source files.

## 6. API Reference

Interactive API documentation is available as a standalone artifact:
- `docs/api/index.html` (ReDoc interface)
- `docs/api/openapi.json` (OpenAPI schema)

## 7. Demonstration Guidance (Recorded Thesis Demo)

For a stable recorded presentation:
1. Start backend and frontend services before recording.
2. Pre-seed representative user data (items, context facts, graph links).
3. Record the module sequence: dashboard -> chat -> database -> graph -> schedule -> profile.
4. Show coverage and CI evidence from results artifacts.

## 8. Known Constraints

- Some dependency deprecation warnings are present and tracked for future maintenance.
- SQLite is suitable for thesis scope but should be migrated to PostgreSQL for multi-user scale.
- External model latency depends on provider availability and network conditions.
