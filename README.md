# ARETON.id — Professional Companion Service Platform

> Premium marketplace for professional companion services. Built as a
> Turborepo monorepo with a NestJS API, two Next.js front-ends (client
> web + admin), and a React Native / Expo mobile app.

[![CI](https://github.com/areton-id/areton-id/actions/workflows/ci.yml/badge.svg)](./.github/workflows/ci.yml)

---

## 📚 Documentation

Top-level docs live in [`docs/`](./docs):

| Doc | What it covers |
|-----|----------------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System diagram, request flow, module boundaries |
| [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) | Local dev setup (API, web, admin, mobile) |
| [`docs/MVP_MAP.md`](./docs/MVP_MAP.md) | MVP vs optional module split for staged rollout |
| [`docs/MODULES.md`](./docs/MODULES.md) | Every API module / web route / admin route, 1-liner each |
| [`docs/API.md`](./docs/API.md) | HTTP + Socket.io surface, auth, rate-limits, conventions |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Prisma schema overview, migrations, seed |
| [`docs/ENV.md`](./docs/ENV.md) | Every environment variable and who reads it |
| [`docs/PORTS.md`](./docs/PORTS.md) | Dev vs prod port matrix + CORS alignment |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | AuthN/Z, PII encryption, rate-limit, CORS, 2FA, audit |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | PM2 + Docker + Cloudflare/Nginx production topology |
| [`docs/TESTING.md`](./docs/TESTING.md) | How to run unit/e2e, smoke, UAT, load tests |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Branch/commit conventions, code style, PR checklist |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Frequent local-dev / deploy issues |

---

## 🏗️ Stack at a glance

| Layer          | Technology                                                    |
|----------------|---------------------------------------------------------------|
| Backend        | NestJS 10, TypeScript 5, Prisma 5, PostgreSQL 16, Redis 7     |
| Client web     | Next.js 14 (App Router), Tailwind, Zustand, React Query       |
| Admin web      | Next.js 14, Tailwind, Recharts, React Query                   |
| Mobile         | React Native 0.79 + Expo 53                                   |
| Real-time      | Socket.io 4.7 (chat, presence, typing, live tracking events)  |
| Auth           | JWT access + refresh rotation, 2FA TOTP, OAuth (Google/Apple) |
| Security       | AES-256-GCM PII encryption, audit log, geofencing, Helmet     |
| Ops            | Docker Compose, PM2, Prometheus metrics, Sentry-optional      |

---

## 🗂️ Repository layout

```
areton-id/
├── apps/
│   ├── api/            # NestJS backend (port 4000)
│   │   ├── prisma/     # schema.prisma + migrations + seed.ts
│   │   └── src/
│   │       ├── common/ # guards, decorators, pipes, audit, encryption
│   │       ├── config/ # Prisma/Redis/JWT/App config modules
│   │       └── modules/ # feature modules (auth, booking, chat, …)
│   ├── web/            # Next.js client (dev 3000 → prod 3003)
│   ├── admin/          # Next.js admin (dev 3001 → prod 3005)
│   └── mobile/         # Expo / React Native app
├── packages/
│   └── shared-types/   # TypeScript interfaces shared across apps
├── docker/             # docker-compose + Dockerfile + nginx
├── infra/              # Cloudflare + Prometheus/Grafana configs
├── scripts/            # DB backup/restore, smoke/UAT/load tests
├── docs/               # ← start here
└── ecosystem.config.js # PM2 process definitions
```

---

## 🚀 Quick start

Prereqs: **Node 20+**, **npm 10+**, **Docker** (for Postgres + Redis).

```bash
# 1. Install dependencies (Turborepo workspaces)
npm install

# 2. Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# 3. Configure env
cp .env.example .env          # root (API + shared)
# apps also read ../../.env via NestJS ConfigModule

# 4. Run migrations + seed
npm run db:migrate
npm run db:seed               # creates admin@areton.id / client@test.com / escort@test.com

# 5. Run everything (turbo will fan out)
npm run dev
```

Then open:

| App   | URL                                   |
|-------|---------------------------------------|
| API   | http://localhost:4000/api             |
| API docs (Swagger) | http://localhost:4000/api/docs |
| Web   | http://localhost:3000                 |
| Admin | http://localhost:3001                 |

> In production `next start` binds web to **3003** and admin to **3005** (see `ecosystem.config.js` and [`docs/PORTS.md`](./docs/PORTS.md)).

---

## 🧪 Scripts

| Script                 | Purpose                                               |
|------------------------|-------------------------------------------------------|
| `npm run dev`          | Run all apps in watch mode via Turborepo              |
| `npm run build`        | Build everything                                      |
| `npm run lint`         | Lint all workspaces                                   |
| `npm run test`         | Run per-app tests                                     |
| `npm run db:migrate`   | `prisma migrate dev`                                  |
| `npm run db:seed`      | Seed baseline accounts (idempotent)                   |
| `npm run db:studio`    | Launch Prisma Studio                                  |
| `npm run format`       | Prettier write                                        |

Operational scripts (require a running deployment):

```
scripts/smoke-test.sh            # health + critical endpoints
scripts/uat-test.sh              # full user-journey UAT
scripts/web-first-regression-smoke.sh
scripts/load-test.js             # k6 load test
scripts/db-backup.sh             # pg_dump → rotating backups
scripts/db-restore.sh            # restore from backup
scripts/test-doku-e2e.sh         # DOKU gateway end-to-end
```

---

## 🔐 Security highlights

- JWT access + refresh token rotation with Redis-backed blacklist
- 2FA TOTP (RFC 6238) compatible with Authy, Google Authenticator, 1Password
- AES-256-GCM encryption for PII (KTP, phone, address, account numbers)
- Audit log for sensitive operations (login, SOS, payout, admin actions)
- Rate limiting: 3 req/s short, 20 req/10s medium, 100 req/min long
- Geofencing + SOS emergency pipeline (see [`docs/SECURITY.md`](./docs/SECURITY.md))
- Helmet security headers
- `forbidNonWhitelisted` on all DTOs

---

## 🧱 MVP mapping

See [`docs/MVP_MAP.md`](./docs/MVP_MAP.md) for the full split.

- **MVP core:** `auth`, `user`, `booking`, `payment` (one gateway), `chat`,
  `review`, `notification` (in-app + email), `safety`, `admin`, `kyc`.
- **Optional / Phase 2+:** `corporate`, `training`, `premium`, `referral`,
  `article`, `testimonial`, `analytics`, `invoice`, `matching`, `gdpr`,
  `metrics` (everything outside the MVP set can be lazy-enabled).

---

## 📜 License

Proprietary — all rights reserved. © ARETON.id
