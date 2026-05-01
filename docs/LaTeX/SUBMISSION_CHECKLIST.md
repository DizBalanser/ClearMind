# Thesis Submission Checklist

## Build

- [ ] Install a LaTeX distribution that provides `pdflatex`, `biber`, and `makeglossaries`.
- [ ] From `docs/LaTeX`, run:
  - `pdflatex main.tex`
  - `biber main`
  - `makeglossaries main`
  - `pdflatex main.tex`
  - `pdflatex main.tex`
- [ ] Confirm the generated PDF has no missing references, bibliography warnings, or glossary warnings.
- [ ] Confirm the page count is in the intended 80-85 page range.

## Visual Assets

- [ ] Confirm every `docs/diagrams/*/diagram.png` export is present.
- [ ] Confirm all screenshots listed in `appendices/a_screenshot_checklist.tex` are present.
- [ ] Confirm no screenshot exposes passwords, tokens, API keys, or private user data.
- [ ] Rebuild the PDF after adding screenshots.

## Final Review

- [ ] Inspect table of contents, glossary, list of acronyms, bibliography, list of figures, list of tables, and list of codes.
- [ ] Check all chapter titles and appendix titles.
- [ ] Check that claims about coverage, CI, and API docs match the current artifacts.
- [ ] Send the PDF and source folder to the supervisor for review.
