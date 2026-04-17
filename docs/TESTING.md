# Testing

## 1. Unit tests (Jest)

```bash
# All workspaces (through Turbo)
npm run test

# Single workspace
npm run test -w apps/api
```

NestJS tests follow the `*.spec.ts` convention and live next to the
code they cover. Use `@nestjs/testing` `Test.createTestingModule` for
DI-aware tests.

## 2. E2E (API)

```bash
cd apps/api
npm run test:e2e
```

Requires PostgreSQL + Redis reachable (Docker compose is enough). If
you keep a dedicated test database, set `DATABASE_URL` in
`apps/api/.env.test`.

## 3. Smoke tests

```bash
scripts/smoke-test.sh <api-base-url> <web-base-url>
```

Hits `/api/health`, `/api/auth/login` with seed creds, key public pages,
and key admin endpoints. Use it after any deploy.

## 4. UAT (full user journey)

```bash
scripts/uat-test.sh <api-base-url>
```

Runs: `register → browse → book → pay → chat → review → withdraw` with
per-step PASS/FAIL reporting.

## 5. Regression smoke (web-first)

```bash
scripts/web-first-regression-smoke.sh
```

Hits critical web routes and measures TTFB. Use for Lighthouse-lite
checks before a release.

## 6. Load testing (k6)

```bash
k6 run scripts/load-test.js
```

Configure `API_URL`, ramp-up, and scenarios via env vars at the top of
the script.

## 7. Payment gateway end-to-end

```bash
# DOKU E2E flow
scripts/test-doku-e2e.sh
```

Add analogous helpers for other gateways as you wire them up. **Never
hard-code gateway credentials inside scripts** — pass them via env
variables.

## 8. Manual QA aids

- Seeded accounts (see [`GETTING_STARTED.md`](./GETTING_STARTED.md)).
- Swagger UI (dev only) at `http://localhost:4000/api/docs`.
- Prisma Studio via `npm run db:studio`.
- Prometheus/Grafana stack via `docker compose -f
  infra/monitoring/docker-compose.yml up -d`.
