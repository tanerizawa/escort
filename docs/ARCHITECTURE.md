# Architecture

## 1. High-level topology

```
                  ┌────────────────────────────────────┐
                  │         Cloudflare / CDN           │
                  └───────────────┬────────────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │  Nginx (reverse proxy)  │
                     └──┬──────────┬──────────┬┘
                        │          │          │
                        ▼          ▼          ▼
                 areton.id  admin.areton.id  api.areton.id
                    :3003         :3005         :4000
                 (Next.js)     (Next.js)      (NestJS)
                                                 │
                 ┌───────────────────────────────┼───────────────────────────┐
                 │                               │                           │
                 ▼                               ▼                           ▼
          PostgreSQL 16                    Redis 7                 Object storage
          (Prisma ORM)                 (sessions/online          (local /uploads
                                      presence/cache/rate-limits) or S3-compatible)
```

The same NestJS API also exposes a **Socket.io** namespace at `/chat`
for real-time chat, typing indicators, presence and live-tracking events.
The mobile (Expo) app consumes the same REST + Socket.io surface.

## 2. Monorepo boundaries

```
apps/api      → NestJS, the single source of truth for business logic
apps/web      → Next.js App Router, client + escort personas
apps/admin    → Next.js App Router, ops / admin persona
apps/mobile   → Expo / React Native (iOS + Android)
packages/shared-types  → pure TS interfaces shared across all apps
```

**Rule:** no app imports from another app. Shared contracts go in
`packages/shared-types`. Side-effectful code never lives there.

## 3. API request lifecycle

```
Client ──HTTP──► Nest Controller
                    │
                    ▼
           ValidationPipe (whitelist + forbidNonWhitelisted)
                    │
                    ▼
              Auth Guard (JwtAuthGuard / RoleGuard)
                    │
                    ▼
             ThrottlerGuard (global)  ◄── Redis
                    │
                    ▼
           Service ──► PrismaService ──► PostgreSQL
                     └─► RedisService (cache, presence)
                     └─► Notification / Audit / Encryption services
                    │
                    ▼
        TransformInterceptor  (wraps response shape)
        LoggingInterceptor    (structured logs)
        MetricsInterceptor    (Prometheus histograms)
                    │
                    ▼
             HttpExceptionFilter (consistent error body)
                    │
                    ▼
               HTTP response
```

## 4. Real-time (Socket.io) flow

```
Client authenticates REST → receives JWT
Client opens Socket.io namespace /chat with auth.token = JWT
Gateway `handleConnection`:
    - verifies JWT via JwtService
    - stores socketId ↔ userId in Redis (TTL 1h)
    - broadcasts `user:online`
Events:
    join:room      → validates booking participation + status, joins booking:<id>
    send:message   → persists via ChatService, emits new:message
    typing:start/stop
    mark:read
```

## 5. Configuration

- `ConfigModule.forRoot` (global) with Joi validation.
- Config namespaces: `app`, `jwt`, `database`, `redis`.
- Env loaded from `apps/api/.env` with fallback to root `../../.env`.
- Startup will fail fast if `DATABASE_URL`, `ENCRYPTION_KEY` (≥16) or JWT
  secrets (in production) are missing.

## 6. Persistence

- **Prisma 5** as the ORM. Single schema at
  `apps/api/prisma/schema.prisma`.
- Migrations live under `apps/api/prisma/migrations/`.
- Seed (idempotent) at `apps/api/prisma/seed.ts` — see
  [`DATABASE.md`](./DATABASE.md).

## 7. Observability

- `/api/metrics` → Prometheus scrape target (counters + histograms,
  wired via `modules/metrics/metrics.interceptor.ts`).
- `/api/health` → liveness / readiness (Postgres + Redis pings).
- Structured request logs via `LoggingInterceptor`.
- Optional Sentry (gated by `SENTRY_DSN`). See `SentryService`.

## 8. Why a monorepo + Turborepo?

- Shared types avoid drift between API and UI contracts.
- Single `npm install` bootstraps every app.
- Turbo caches `build` / `lint` / `test` per workspace.
- PM2 orchestrates the three Node services in prod
  (`ecosystem.config.js`).
