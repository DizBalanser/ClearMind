# ClearMind - Personal Digital Twin Assistant

ClearMind is a thesis project for a Personal Digital Twin Assistant focused on productivity and self-management.
The system combines a React frontend, FastAPI backend, memory models, and LLM-powered reasoning agents.

## Repository Structure

- `src/frontend/` - React + TypeScript + Vite application
- `src/backend/` - FastAPI API, orchestration services, and data models
- `docs/` - milestone and technical documentation
- `docs/diagrams/` - Chapter 3 thesis diagrams (PlantUML + PNG exports)

## Architecture Overview

The current Phase 2 architecture is organized into:
- Presentation layer (frontend pages and layout)
- API layer (FastAPI routes)
- Service layer (orchestrator, agents, profile memory)
- Data layer (SQLAlchemy models + SQLite)
- External LLM integration (Gemini APIs)

Main architecture diagram:
- `docs/diagrams/system_architecture/diagram.png`

## Quick Start

### Backend

```bash
cd src/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload
```

Backend endpoints:
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Frontend app:
- `http://localhost:5173`

## Key Documentation

- Milestones: `docs/milestones.md`
- Chapter 3 Diagram Index: `docs/diagrams/CHAPTER3_DIAGRAM_INDEX.md`
- Backend details: `src/backend/README.md`
- Frontend details: `src/frontend/README.md`

## Notes

- Keep sensitive values only in local `.env` files.
- Update PlantUML source (`.puml`) first, then regenerate diagram PNGs for thesis consistency.
