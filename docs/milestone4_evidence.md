# Milestone 4 Evidence Sheet

## 1. Quality Pipeline Evidence

- CI workflow file: `.github/workflows/ci.yml`
- Lint gate: `ruff check .`
- Test command: `pytest --cov=app --cov-fail-under=80`
- Final reported coverage: **86.94%**
- Coverage threshold status: PASS

## 2. API Documentation Evidence

- Export script: `src/backend/scripts/export_api_docs.py`
- Generated schema: `docs/api/openapi.json`
- Standalone HTML reference: `docs/api/index.html`

## 3. Documentation Evidence

- Feasibility plan: `docs/feasibility_plan.md`
- System specs: `docs/system_specifications.md`
- User stories: `docs/user_stories.md`
- Backend overview: `docs/developer_notes/backend_overview.md`
- User manuals:
  - `docs/user_manual/interface_guide.md`
  - `docs/user_manual/final_manual.md`
- Thesis drafts:
  - `docs/thesis/Methodology_Draft.md`
  - `docs/thesis/Results_Draft.md`
  - `docs/thesis/Complete_Thesis_Draft.md`

## 4. Diagrams Evidence

- Diagram index: `docs/diagrams/CHAPTER3_DIAGRAM_INDEX.md`
- All required chapter diagrams available under `docs/diagrams/` as `.puml` + `.png`

## 5. Evaluation Evidence

- Results summary: `results/evaluation_summary.md`
- Coverage report: `results/test_coverage_report.md`

## 6. Demonstration Evidence

- Demonstration mode requirement waived for this submission path.
- Presentation is delivered through a recorded video walkthrough of stable core flows.
