# Database

## 1. Engine

- **PostgreSQL 16** in production, same in Docker dev.
- ORM: **Prisma 5** (`apps/api/prisma/schema.prisma`).

## 2. Core models

| Model              | Purpose |
|--------------------|---------|
| `User`             | Base account (role: `CLIENT`, `ESCORT`, `ADMIN`, `SUPER_ADMIN`). |
| `EscortProfile`    | 1-1 with a `User` where role is `ESCORT`. |
| `Certification`    | Files + metadata for escort certifications. |
| `KycVerification`  | KYC state + encrypted PII references. |
| `Booking`          | Booking state machine + scheduling + money. |
| `Payment`          | Escrow record per booking. |
| `Review`           | Rating + sub-scores + optional reply. |
| `ChatMessage`      | Booking-scoped messages. |
| `IncidentReport`   | SOS + incident evidence. |
| `Notification`     | In-app notifications. |
| `Favorite`         | Client ↔ escort bookmarks. |
| `AuditLog`         | Security-critical event trail. |
| `PromoCode`        | Promo CRUD. |

See `schema.prisma` for the authoritative list.

## 3. Migrations

```bash
# from repo root
npm run db:migrate                # prisma migrate dev
npm run db:generate               # prisma generate (client)
```

Migration folders:

```
apps/api/prisma/migrations/
  20260305182604_init/
  20260306033842_add_corporate_training_premium/
  20260312185133_add_forfeited_refund_claims/
  20260317170834_add_withdrawal_model/
  20260317193336_add_incident_evidence/
```

Never edit a committed migration SQL — add a new one instead.

## 4. Seed

`apps/api/prisma/seed.ts` (idempotent). Creates:

| Email                | Role         |
|----------------------|--------------|
| `admin@areton.id`    | SUPER_ADMIN  |
| `client@test.com`    | CLIENT       |
| `escort@test.com`    | ESCORT + profile |

Run:

```bash
npm run db:seed
# or, once Prisma is aware via `"prisma": { "seed": ... }`:
cd apps/api && npx prisma db seed
```

## 5. Encryption

Sensitive PII fields (KTP, phone, addresses, payout account numbers) go
through `EncryptionService` (`aes-256-gcm`). **Never store raw PII** —
always call `encrypt()` on write and `maskKTP()` / `maskPhone()` on read
for admin/UI surfaces. See [`SECURITY.md`](./SECURITY.md).

## 6. Backups

Production backup/restore helpers live in `scripts/`:

- `scripts/db-backup.sh` — `pg_dump` rotating backups. Wire via cron, e.g.
  `0 2 * * * /srv/areton-id/scripts/db-backup.sh >> /var/log/areton-backup.log 2>&1`.
- `scripts/db-restore.sh` — restore a dump from file.

Test your restore path at least monthly.
