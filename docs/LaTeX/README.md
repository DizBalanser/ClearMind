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
makeglossaries main
pdflatex main.tex
pdflatex main.tex
```

The document uses `biblatex` with `biber`, and `glossaries` for the glossary and list of acronyms.

## Required Visual Assets

The thesis expects final screenshots and diagram exports to be present before submission.

Before final submission:

1. Confirm all PlantUML exports under `docs/diagrams/*/diagram.png` are present.
2. Save application screenshots exactly as listed in `appendices/a_screenshot_checklist.tex`.
3. Rebuild the PDF and inspect all figure captions, references, and list-of-figures entries.
