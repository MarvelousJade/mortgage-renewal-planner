# Contributing

Thank you for helping improve RenewalReady.

## Local checks

```bash
cd backend && ./mvnw verify
cd ../frontend && npm ci && npm run build && npm run test:ci
```

Java 21, Node.js 22 and a Chrome/Chromium binary are required. Alternatively, run `docker compose up --build` from the repository root.

## Workflow

1. Open an issue describing the user problem or defect.
2. Branch from `main` using `feature/<short-name>` or `fix/<short-name>`.
3. Add or update tests for calculation changes.
4. Record significant architectural decisions under `docs/adr`.
5. Open a focused pull request and include screenshots for interface changes.

## Financial calculation changes

Calculation pull requests must identify the source and effective date of any Canadian rule being implemented. Include representative examples and boundary tests. Do not present estimates as lender quotes or financial advice.
