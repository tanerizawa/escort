# ARETON.id — Professional Companion Service Platform

> Premium platform for professional companion services with enterprise-grade security, real-time features, and comprehensive management tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 10, TypeScript, Prisma 5, PostgreSQL 16, Redis 7 |
| **Frontend Web** | Next.js 14 (App Router), Tailwind CSS, Zustand |
| **Frontend Admin** | Next.js 14, Tailwind CSS, Recharts |
| **Real-time** | Socket.io 4.7 (chat, presence, typing) |
| **Infra** | Docker Compose, Turborepo monorepo |
| **Auth** | JWT (access + refresh), 2FA TOTP, bcrypt |
| **Security** | AES-256-GCM PII encryption, audit logging, geofencing |

## Architecture

```
prestige-id/
├── apps/
│   ├── api/             # NestJS backend (port 4000)
│   │   ├── prisma/      # Database schema & migrations
│   │   └── src/
│   │       ├── common/  # Guards, decorators, pipes, audit, encryption
│   │       ├── config/  # App, DB, JWT, Redis configuration
│   │       └── modules/ # Feature modules
│   ├── web/             # Next.js frontend (port 3000)
│   │   └── src/
│   │       ├── app/     # App Router pages
│   │       ├── components/ # UI components
│   │       ├── lib/     # API client, utilities
│   │       └── stores/  # Zustand state management
│   └── admin/           # Next.js admin panel (port 3001)
├── packages/
│   └── shared-types/    # Shared TypeScript interfaces
├── docs/                # Documentation
├── docker-compose.yml   # PostgreSQL, Redis, pgAdmin
└── turbo.json           # Turborepo config
```

## Modules

### Backend API Modules
- **Auth** — Register, login, refresh, reset password, 2FA TOTP
- **User** — Profile management, escort profiles, search, favorites, availability
- **Booking** — CRUD, state machine (PENDING → CONFIRMED → ONGOING → COMPLETED), reschedule, cancel, promo validation
- **Payment** — Escrow, release, refund, tips, cancellation fees, invoices, withdraw
- **Chat** — Real-time messaging via Socket.io, typing indicators, read receipts, online presence
- **Review** — Ratings (1-5), sub-scores (attitude, punctuality, professionalism), replies, flagging
- **Notification** — In-app notifications, preferences, unread counts
- **Safety** — SOS alerts, incident reports, live GPS tracking, geofencing, late alerts
- **Admin** — Dashboard stats, user management, escort verification, incidents, finance, promo codes, audit logs
- **Matching** — AI-powered escort recommendations

### Database Models (Prisma)
`User`, `EscortProfile`, `Certification`, `Booking`, `Payment`, `Review`, `ChatMessage`, `IncidentReport`, `Notification`, `Favorite`, `AuditLog`, `PromoCode`

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Setup

```bash
# Clone & install dependencies
git clone <repo>
cd prestige-id
npm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Setup environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your database credentials

# Run database migrations
cd apps/api
npx prisma migrate dev
npx prisma generate
cd ../..

# Start all apps in development mode
npm run dev
```

### Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgresql://areton:areton_dev_2026@localhost:5432/areton_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_KEY=your-encryption-key-min-32-chars
PORT=4000
NODE_ENV=development
```

### Available Scripts

```bash
# Root commands (via Turborepo)
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps

# Individual apps
cd apps/api && npm run start:dev     # Backend only
cd apps/web && npm run dev           # Frontend only
cd apps/admin && npm run dev         # Admin only
```

### API Documentation

Swagger UI available at `http://localhost:4000/api/docs` when running in development mode.

## Key Pages

### Client Web (`localhost:3000`)
| Path | Description |
|------|-------------|
| `/login`, `/register` | Authentication |
| `/escorts` | Browse & search escorts |
| `/escorts/[id]` | Escort detail + booking |
| `/bookings` | Booking management |
| `/bookings/[id]/tracking` | Live GPS tracking |
| `/chat` | Messages |
| `/payments` | Payment history & invoices |
| `/favorites` | Favorite escorts |
| `/profile` | Profile settings |
| `/profile/security` | 2FA setup & security |
| `/notifications` | Notifications & preferences |
| `/safety` | Safety guidelines |

### Escort Web (`localhost:3000`)
| Path | Description |
|------|-------------|
| `/register/escort` | Multi-step registration |
| `/escort/profile` | Escort profile editor |
| `/escort/calendar` | Availability calendar |
| `/escort/earnings` | Earnings dashboard |
| `/escort/analytics` | Performance analytics |

### Admin (`localhost:3001`)
| Path | Description |
|------|-------------|
| `/dashboard` | Platform statistics |
| `/users` | User management |
| `/escorts` | Escort verification |
| `/bookings` | All bookings |
| `/disputes` | Dispute resolution |
| `/incidents` | Incident management |
| `/finance` | Financial summary |
| `/promo-codes` | Promo code management |
| `/audit-logs` | Security audit trail |
| `/settings` | Platform configuration |

## Security Features

- **JWT Authentication** with access/refresh token rotation
- **2FA TOTP** compatible with Google Authenticator, Authy, 1Password
- **PII Encryption** using AES-256-GCM for sensitive data (KTP, phone numbers)
- **Audit Logging** for all security-critical operations
- **Rate Limiting** (3 req/s short, 20 req/10s medium, 100 req/min long)
- **Geofencing** with automatic alerts on boundary breaches
- **SOS Emergency System** with severity-based incident tracking
- **Password Hashing** with bcrypt (12 rounds)
- **Refresh Token Blacklisting** via Redis

## Brand

- **Domain**: areton.id
- **Colors**: Gold (#c9a96e), Dark (#0b1120)
- **Support**: support@areton.id

## License

Proprietary — All rights reserved.
