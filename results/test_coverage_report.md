# Test Coverage Report

## Command Used

```bash
pytest --cov=app --cov-fail-under=80
```

## Outcome

- Test status: PASS
- Coverage gate: PASS
- Reported total coverage: **86.94%**

## Interpretation

- The enforced threshold (`>=80%`) is satisfied.
- Coverage includes model and critical route/service paths needed for milestone acceptance.
- External API behavior in tests is controlled through mocking to avoid unstable live calls in CI.

## Evidence Notes

- Configuration source: `src/backend/pyproject.toml`
- CI execution path: `.github/workflows/ci.yml`
