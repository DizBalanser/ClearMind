# User Stories

This document defines user stories for ClearMind Phase 2 using the format:
"As a [role], I want to [goal], so that [benefit]."

Each story includes:
- standard acceptance criteria (Given/When/Then);
- explicit edge/error case handling, as required for Milestone 4 quality and thesis validation.

## US-01: Authenticate and Access Protected Workspace

As an authenticated user, I want to sign in and access protected pages, so that my personal data remains private and available only to me.

### Acceptance Criteria
- Given I am on the public landing page, when I submit valid credentials, then the system issues a token and grants access to protected routes.
- Given I am authenticated, when I request my profile (`/users/me`), then I receive only my own user data.

### Edge/Error Case Handling
- Given credentials are invalid, when login is submitted, then the system returns an authentication error and does not create a session.
- Given no token is present, when I open a protected route, then I am redirected away from protected content.

## US-02: Capture Thoughts Through Chat

As a productivity-focused user, I want to submit free-form messages in chat, so that I can transform unstructured thoughts into actionable outputs.

### Acceptance Criteria
- Given I am authenticated, when I send non-empty text, then the orchestrator processes the input and returns a structured assistant response.
- Given the assistant returns extracted items, when the response is displayed, then I can review item metadata (category, priority, etc.).

### Edge/Error Case Handling
- Given the input is empty or whitespace, when send is triggered, then the UI does not submit the request.
- Given backend processing fails, when the request completes with an error, then the UI shows a graceful fallback message instead of crashing.
- Given the Gemini API times out or fails, when the orchestrator cannot obtain a valid model response, then the API returns a safe fallback and the session remains usable.

## US-03: Persist Conversation History

As a returning user, I want to retrieve recent chat history, so that I can continue work without losing context.

### Acceptance Criteria
- Given I have prior messages, when I open the chat page, then recent messages are loaded and displayed chronologically.
- Given a new message exchange occurs, when persistence succeeds, then both user and assistant messages are stored.

### Edge/Error Case Handling
- Given history retrieval fails, when chat initializes, then the UI logs the failure and preserves a usable empty/default state.
- Given malformed history payloads, when rendering starts, then the UI does not crash and skips invalid entries.

## US-04: Manage Life Database Items

As an organized user, I want to create, update, and delete tasks/ideas/thoughts, so that I can maintain a structured personal knowledge base.

### Acceptance Criteria
- Given valid item data, when I create an item, then it is stored and appears in the database list.
- Given an existing item, when I edit status or content, then updates are persisted and reflected immediately in the UI.
- Given an existing item, when I confirm deletion, then it is removed from persistent storage.

### Edge/Error Case Handling
- Given API mutation fails, when save/delete is attempted, then the UI keeps prior state and surfaces a recoverable error path.
- Given filters produce no results, when the list is rendered, then the UI provides a valid empty-state response.

## US-05: Build and Analyze Knowledge Graph

As an analytical user, I want to view and refine links between my items, so that I can discover relationships and improve planning decisions.

### Acceptance Criteria
- Given I own multiple items, when I open graph view, then nodes and valid links are returned for my account only.
- Given two valid items, when I create a manual link, then the link is persisted and visible in subsequent graph fetches.
- Given sufficient item context, when I run graph analysis, then high-confidence AI-suggested links are created or proposed.

### Edge/Error Case Handling
- Given I attempt a self-link, when create-link is requested, then the API rejects it with a validation error.
- Given a duplicate link exists, when create-link is requested, then the API returns a conflict response.
- Given graph analysis receives insufficient items (<2), when analyze is requested, then the API returns a valid empty result without failure.

## US-06: Maintain Global Profile Memory

As a user, I want to review and curate long-term profile facts, so that future assistant responses better reflect my identity, constraints, and goals.

### Acceptance Criteria
- Given existing context entries, when I open profile memory, then active context and recent update history are visible.
- Given a valid new fact, when I submit context creation, then the fact is persisted with category metadata.
- Given an existing context entry, when I update or delete it, then changes are committed and visible on reload.
- Given questionnaire answers, when I submit reviewed responses, then valid answers are converted into context entries.

### Edge/Error Case Handling
- Given a fact is empty, when create/update is submitted, then the API rejects the request with clear error detail.
- Given a context ID is invalid, when update/delete is requested, then the API returns not-found and does not alter data.
- Given profile-memory extraction fails due to LLM issues, when candidate generation is attempted, then the system fails safely and keeps core chat functionality available.

## US-07: Generate and Export Schedule

As a user with planning needs, I want to view scheduled blocks and export them as calendar files, so that I can execute plans outside the app.

### Acceptance Criteria
- Given schedule blocks exist, when I open schedule view, then blocks are grouped and displayed by date/time.
- Given schedule export is requested, when export succeeds, then an `.ics` file is downloaded.

### Edge/Error Case Handling
- Given no schedule is available, when schedule view loads, then the UI displays an actionable empty-state message.
- Given export fails (API/network error), when export is requested, then the UI handles the failure without breaking navigation.

## US-08: Consume Dashboard Insights

As a decision-making user, I want telemetry and trend views, so that I can monitor productivity and memory/graph dynamics over time.

### Acceptance Criteria
- Given analytics data is available, when dashboard loads, then telemetry cards and charts render correctly.
- Given item status changes, when I toggle completion, then dashboard data refreshes and reflects updated signals.

### Edge/Error Case Handling
- Given analytics fetch fails, when dashboard initializes, then the UI exits loading state and remains navigable.
- Given partial analytics payloads, when rendering occurs, then defaults are applied and the dashboard remains stable.

## US-09: Reliable Thesis Presentation (Demo Resilience)

As a presenter, I want a deterministic demonstration mode, so that I can deliver a stable live thesis demo even if network or external APIs are unstable.

### Acceptance Criteria
- Given Demo Mode is enabled, when I navigate key pages, then representative visual data is displayed consistently.
- Given Demo Mode is disabled, when I use the app, then real backend/API behavior resumes.

### Edge/Error Case Handling
- Given backend is unavailable during demo, when Demo Mode is enabled, then presentation flows still operate from seeded mock data.
- Given Demo Mode state persists between refreshes, when the app reloads, then the selected mode is restored without manual reconfiguration.

## Coverage Note

These stories intentionally include both normal and failure behavior to support:
- manual non-programmer validation;
- automated test design (happy path, error path, and edge-case coverage);
- Milestone 4 readiness and thesis defensibility.
