# Security

## 1. AuthN

- **JWT access + refresh** with rotation.
- Refresh tokens are blacklisted in Redis on logout / rotation.
- **2FA TOTP** (RFC 6238) compatible with Google Authenticator, Authy,
  1Password.
- **OAuth** helpers for Google / Apple (via passport strategies).

## 2. AuthZ

- Every protected controller uses `JwtAuthGuard`.
- Admin routes additionally use `RoleGuard` (checks `user.role ∈
  {ADMIN, SUPER_ADMIN}`).
- Chat participation is verified at both REST and Socket.io layers by
  looking up `{ clientId, escortId }` on the booking.

## 3. PII encryption

- **Algorithm:** `aes-256-gcm`.
- **Key derivation:** `scryptSync(ENCRYPTION_KEY, 'areton-salt-v1', 32)`.
- **Storage format:** `iv:authTag:ciphertext` (hex).
- **Service:** `apps/api/src/common/services/encryption.service.ts`.
- **Startup guard:** `ENCRYPTION_KEY` **must** be present (validated by
  both `app.config.ts` and the service constructor). In production the
  key must be ≥32 characters.
- **Masking helpers:** `maskKTP`, `maskPhone` for UI display.

Apply encryption to: KTP numbers, phone numbers, physical addresses,
bank / payout account numbers, anything the platform regards as PII.
Never log PII in plaintext — pass it through a masker first.

## 4. Rate limiting

Three global buckets via `@nestjs/throttler`:

| Name   | Window | Limit |
|--------|--------|-------|
| short  | 1s     | 3     |
| medium | 10s    | 20    |
| long   | 60s    | 100   |

Webhook controllers should opt out with `@SkipThrottle()` so gateways
can burst events.

## 5. Audit log

`AuditService.log(...)` writes to the `AuditLog` table. Actions that
**must** be audited:

- login / logout / password reset
- 2FA enable/disable
- booking state transitions
- SOS trigger (severity `CRITICAL`)
- payout / withdrawal
- admin moderation actions
- KYC approval / rejection

Severity levels: `INFO` | `WARN` | `CRITICAL`.

## 6. Headers & transport

- **Helmet** is enabled globally with CSP disabled for the API
  (front-end handles CSP; API serves only JSON + `/uploads`).
- `crossOriginResourcePolicy: 'cross-origin'` so the web apps can load
  uploaded media.
- Terminate TLS at Cloudflare → Nginx, keep Node on HTTP inside the VPC.

## 7. SOS pipeline

1. Mobile / web calls `POST /api/safety/sos` with `bookingId` and
   optional GPS coordinates.
2. `SafetyService.triggerSOS`:
   - Creates an `IncidentReport` with severity 5.
   - If GPS provided, caches it in Redis via `pingUserLocation`.
   - Writes a `CRITICAL` audit log entry.
   - Fires admin notification (`NotificationService.notifyAdmins`).
3. **TODO (pre-launch):** wire SMS/PagerDuty/phone escalation in the
   Notification module for `SAFETY` severity.

## 8. Things to rotate before any public deploy

- Seed passwords (`password123`).
- All `.env.example` placeholders.
- Any gateway credential; never commit keys in scripts.

## 9. Reporting security issues

Email `security@areton.id`. Do not file public GitHub issues for
security reports.
