# Interface Guide (Milestone 3)

This guide describes how to use the ClearMind web interface in Prototype 2 and how each screen maps to core user workflows.

## 1. Access and Navigation

### Public entry

- Open the app and land on the public home screen (`/`).
- Use the authentication modal to register or log in.

### Protected area

After authentication, users access:
- `/dashboard` - analytics and command center
- `/chat` - conversational multi-agent workflow
- `/database` - life database item management
- `/schedule` - generated schedule timeline and export
- `/profile` - memory profile and context editing

Navigation is persistent through:
- Left sidebar (primary sections)
- Top navigation bar (global controls and identity context)

## 2. Screen-by-Screen Guide

## 2.1 Landing Page (`/`)

Purpose:
- Introduce system value proposition.
- Trigger sign-up/sign-in flow.

Primary actions:
- Open auth modal.
- Switch between login and registration forms.

Expected feedback:
- Validation feedback for credentials.
- Redirect to onboarding/dashboard after successful login.

## 2.2 Onboarding (`/onboarding`)

Purpose:
- Capture first profile context (occupation, goals, personality hints).

Primary actions:
- Fill profile fields.
- Submit onboarding to persist initial preferences.

Expected feedback:
- Clear success/error messaging.
- Transition into protected app shell.

## 2.3 Dashboard (`/dashboard`)

Purpose:
- Give a high-level operational view of user activity and cognitive signals.

Primary actions:
- Review telemetry cards.
- Inspect activity heatmap and trend visuals.
- Jump directly into chat workflows.

Expected feedback:
- Loading state while fetching profile/items/analytics.
- Graceful fallback if analytics calls fail.

## 2.4 Chat (`/chat`)

Purpose:
- Main interaction surface with the orchestrated multi-agent system.

Primary actions:
- Send typed messages.
- Use optional voice capture.
- Review agent responses (items, schedules, reflections, memory candidates).
- Accept or ignore suggested memory candidates.

Expected feedback:
- Immediate user message echo.
- Loading state during backend processing.
- Error fallback response if request fails.

## 2.5 My Life Database (`/database`)

Purpose:
- Manage structured personal knowledge items (tasks, ideas, thoughts).

Primary actions:
- Add, edit, delete entries.
- Filter by category/status/subcategory.
- Toggle list vs graph-assisted understanding.

Expected feedback:
- Visual confirmation for item updates.
- Error message on failed CRUD actions.
- Empty-state content when no items match filters.

## 2.6 Schedule View (`/schedule`)

Purpose:
- Show planned time blocks produced by scheduler logic.

Primary actions:
- Review grouped daily blocks.
- Export schedule as `.ics`.

Expected feedback:
- Loading indicator while schedule data loads.
- Empty-state instruction when no schedule exists.

## 2.7 User Profile (`/profile`)

Purpose:
- Manage long-term memory context used for personalization.

Primary actions:
- Add/edit/delete memory facts.
- Submit questionnaire answers.
- Review extracted profile update logs.

Expected feedback:
- Category-tagged facts and confidence cues.
- Save/delete progress indicators.
- Clear error messages for failed persistence.

## 3. Interaction Quality and Error Handling

Current quality controls in UI:
- Loading states for asynchronous pages.
- Input validation for required forms.
- Retry-friendly error messaging for failed API actions.
- Contextual empty states (e.g., no schedule, no memories).

Recommended quality checks before milestone review:
- Verify visual alignment in sidebar/header/page cards at common screen sizes.
- Confirm authentication redirect behavior for protected routes.
- Confirm every primary action has visible success or failure feedback.

## 4. Manual Test Scenarios (Non-Programmer Friendly)

1. Register and log in, then verify access to all protected sections.
2. Send a chat message that creates at least one item and one memory suggestion.
3. Accept one memory candidate and confirm it appears in Profile context.
4. Create and edit an item in My Life Database; verify changes persist after refresh.
5. Open Schedule page and export `.ics` file.
6. Open Dashboard and confirm telemetry/visual sections render without overlap.

## 5. Known Milestone 3 Constraints

- Advanced polish for edge-case UX states may still be refined in Milestone 4.
- Automated visual regression testing is not yet configured.
- Coverage threshold and CI reporting should be formalized in project pipeline docs.
