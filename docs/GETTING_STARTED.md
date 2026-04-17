# Getting Started

## 1. Prerequisites

| Tool     | Version |
|----------|---------|
| Node.js  | **≥ 20** (`engines.node` enforced) |
| npm      | **≥ 10** |
| Docker   | Latest (for Postgres + Redis) |
| Expo CLI | `npx expo` (only for mobile) |

Optional: `psql` for direct DB access, `redis-cli` for Redis inspection.

## 2. Clone & install

```bash
git clone git@github.com:areton-id/areton-id.git
cd areton-id
npm install           # Turborepo will install every workspace
```

## 3. Start infra

```bash
docker compose -f docker/docker-compose.yml up -d
# Optional: pgAdmin on :5050
docker compose -f docker/docker-compose.yml --profile tools up -d
```

## 4. Environment

```bash
cp .env.example .env
```

Fill in at minimum:

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Prisma connection string |
| `ENCRYPTION_KEY` | AES-256-GCM key, ≥16 chars in dev, ≥32 in prod |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Required in prod |
| `REDIS_HOST` / `REDIS_PORT` | defaults: `localhost:6379` |

All variables are documented in [`ENV.md`](./ENV.md).

## 5. Database

```bash
npm run db:migrate   # runs migrations
npm run db:seed      # creates admin / client / escort demo accounts
```

Seed credentials:

| Email                | Password       | Role         |
|----------------------|----------------|--------------|
| `admin@areton.id`    | `password123`  | SUPER_ADMIN  |
| `client@test.com`    | `password123`  | CLIENT       |
| `escort@test.com`    | `password123`  | ESCORT       |

> Rotate these immediately if you deploy to any shared environment.

## 6. Run

```bash
npm run dev
```

Turbo launches every `dev` script in parallel:

| App     | Dev URL                  |
|---------|--------------------------|
| API     | http://localhost:4000    |
| Swagger | http://localhost:4000/api/docs |
| Web     | http://localhost:3000    |
| Admin   | http://localhost:3001    |

> **Port mismatch between dev and prod is expected** — see
> [`PORTS.md`](./PORTS.md) for the full matrix.

## 7. Mobile (Expo)

```bash
cd apps/mobile
npm run start       # Expo dev server
npm run android     # build + launch on connected Android
npm run ios         # macOS only
```

Android native dev helper scripts live in `apps/mobile/android/`
(`dev-run.sh`, `build-wrapper.sh`) and are documented in
`apps/mobile/android/AGENTS.md`.

## 8. Common tasks

```bash
# Run a single workspace
npm run dev -w apps/api
npm run dev -w apps/web

# Prisma Studio
npm run db:studio

# Lint everything
npm run lint

# Build everything (Turbo cache-aware)
npm run build
```

## 9. Next steps

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the pieces fit
- [`MVP_MAP.md`](./MVP_MAP.md) — what to ship first
- [`TESTING.md`](./TESTING.md) — smoke / UAT / load tests
- [`SECURITY.md`](./SECURITY.md) — AuthZ, encryption, rate limits
