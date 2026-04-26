import json
import os
import sys
from pathlib import Path

# Fallbacks so docs export can run in clean environments
os.environ.setdefault("DATABASE_URL", "sqlite:///./clearmind.db")
os.environ.setdefault("SECRET_KEY", "docs-export-secret")

backend_root = Path(__file__).resolve().parents[1]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    api_docs_dir = repo_root / "docs" / "api"
    os.makedirs(api_docs_dir, exist_ok=True)

    openapi_path = api_docs_dir / "openapi.json"
    html_path = api_docs_dir / "index.html"

    schema = app.openapi()
    with open(openapi_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)

    html = """<!DOCTYPE html>
<html>
  <head>
    <title>ClearMind API Reference</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style> body { margin: 0; padding: 0; } </style>
  </head>
  <body>
    <redoc spec-url='openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"OpenAPI schema exported to: {openapi_path}")
    print(f"ReDoc HTML exported to: {html_path}")


if __name__ == "__main__":
    main()
