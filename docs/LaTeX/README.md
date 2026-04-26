# ClearMind Thesis LaTeX Project

This directory contains the final English thesis source for:

**Design and Implementation of a Personal Digital Twin Assistant for Productivity and Self-Management**

## Structure

- `main.tex` - thesis entry point
- `chapters/` - Chapter 1 to Chapter 7
- `appendices/` - screenshot checklist, traceability matrix, detailed user stories, and operational manual excerpt
- `references.bib` - BibLaTeX bibliography
- `images/screenshots/` - expected location for final screenshots

## Build

Run from `docs/LaTeX`:

```bash
pdflatex main.tex
biber main
pdflatex main.tex
pdflatex main.tex
```

The document uses `biblatex` with `biber`.

## Required Visual Assets

The thesis is currently compile-safe without final PNG files because `main.tex` renders labeled placeholders when images are missing.

Before final submission:

1. Export all PlantUML files under `docs/diagrams/*/diagram.puml` to `diagram.png`.
2. Save application screenshots exactly as listed in `appendices/a_screenshot_checklist.tex`.
3. Rebuild the PDF and inspect all figure captions, references, and list-of-figures entries.

## Page Target

The content is structured for an 80-85 page thesis after diagrams, screenshots, references, and appendices are included. If the compiled PDF is below target, expand Chapter 6 with measured latency/cost/usability tables. If it is above target, move long tables from Chapter 3 or Appendix B into supervisor-only supporting material.
