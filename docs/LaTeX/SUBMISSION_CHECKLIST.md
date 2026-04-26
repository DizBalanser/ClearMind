# Thesis Submission Checklist

## Build

- [ ] Install a LaTeX distribution that provides `pdflatex` and `biber`.
- [ ] From `docs/LaTeX`, run:
  - `pdflatex main.tex`
  - `biber main`
  - `pdflatex main.tex`
  - `pdflatex main.tex`
- [ ] Confirm the generated PDF has no missing references or bibliography warnings.
- [ ] Confirm the page count is in the intended 80-85 page range.

## Visual Assets

- [ ] Export every `docs/diagrams/*/diagram.puml` file to `diagram.png`.
- [ ] Capture all screenshots listed in `appendices/a_screenshot_checklist.tex`.
- [ ] Confirm no screenshot exposes passwords, tokens, API keys, or private user data.
- [ ] Rebuild the PDF after adding screenshots.

## Final Review

- [ ] Inspect table of contents, bibliography, list of figures, and list of tables.
- [ ] Check all chapter titles and appendix titles.
- [ ] Check that claims about coverage, CI, and API docs match the current artifacts.
- [ ] Send the PDF and source folder to the supervisor for review.
