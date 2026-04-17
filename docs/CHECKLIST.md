# Implementation Checklist

Status of the deep-analysis plan captured in
[`MVP_MAP.md`](./MVP_MAP.md) and surrounding docs. Each item links to
the commit(s) that shipped it.

## ✅ Phase 1 — Cleanup & hardening

- [x] Delete corrupted / accidental-paste filenames in `/` and `apps/api/`
- [x] Remove leaked NOWPayments API key (`test-crypto-payment.sh`)
- [x] Remove dormant one-off scripts (`test-phase16.sh`)
- [x] Remove cancelled infra (`infra/_archived/*`)
- [x] Remove historical Android debug notes (`EMULATOR_ERRORS_ANALYSIS.md`, `BUILD_FIXES_SUMMARY.md`)
- [x] Consolidate 5 ad-hoc seed scripts into a single idempotent `apps/api/prisma/seed.ts`
- [x] Register `prisma.seed` hook in `apps/api/package.json`
- [x] Harden `EncryptionService`: fail-fast, require ≥32 chars in production
- [x] Align CORS (HTTP + Socket.io) with `CORS_ORIGINS` and PM2 ports `3003`/`3005`
- [x] Widen `TriggerSOSDto` to accept optional GPS + severity; persist GPS in Redis + audit log
- [x] Drop "Prestige Companion" tagline + `prestige-id` paths
- [x] Replace stale README with a 14-file `docs/` tree

## ✅ Phase 2 — Documented plan implementation

- [x] `ENABLE_*` feature flags for Phase 2+ modules in `AppModule`
  - `matching`, `corporate`, `training`, `premium`, `referral`,
    `articles`, `testimonials`, `gdpr`, `analytics`
- [x] Typed `features` config namespace (`apps/api/src/config/features.config.ts`)
- [x] Joi schema accepts the new flag env vars
- [x] Bootstrap logs effective feature flags
- [x] Bootstrap preflight warns on missing Brevo / Firebase / Twilio credentials and production JWT secrets
- [x] Wire `AuthService.sendOTP` → `WhatsAppService.sendOTP` (MOCK-safe)
- [x] `NotificationService.notifyAdmins(..., { severity })` with WhatsApp escalation on `CRITICAL`
- [x] `SafetyService.triggerSOS` + `reportIncident` (severity ≥4) pass `CRITICAL`
- [x] Clear stale `TODO` comments in `chat.service.ts`, `auth.service.ts`, `booking.service.ts`
- [x] `BookingService.recommendReplacement` notifies client + admins

## ✅ Phase 3 — Latent bugs + DX

- [x] **Payment mock toggle bug**: `isPaymentMockEnabled()` now honors the documented
      `ENABLE_PAYMENT_MOCK` env var and defaults to OFF instead of silently
      forcing every checkout into mock mode.
- [x] Tighten `TriggerSOSDto`, `ReportIncidentDto`, `PingLocationDto`,
      `UpdateLocationDto`, `ValidatePromoCodeDto` with `Min`/`Max` validators.
- [x] `@SkipThrottle()` on payment webhook routes (Xendit, NOWPayments, DOKU)
      so provider retries aren't dropped by the global throttler.
- [x] Add minimal `.eslintrc.json` configs in `apps/api`, `apps/web`,
      `apps/admin`, `apps/mobile`. `npm run lint` now works across the whole
      monorepo via Turbo (`5/5 tasks successful`).
- [x] Add `packageManager: npm@10.9.0` to root `package.json` so Turborepo 2.x
      can resolve workspaces.
- [x] Clear 1 `no-useless-catch` lint error in mobile `stores/auth.ts`.
- [x] Remove dangling `eslint-disable` referencing an unloaded rule in
      `apps/web/src/components/map/map-view.tsx`.

## 🟡 Known partial items (intentional, tracked)

- Mobile `MapScreen` graceful-degrades when `react-native-maps` isn't
  native-linked. Pin a working native build before general availability.
- Payment webhooks have signature-verification hooks; confirm each active
  gateway before flipping live credentials.
- Demo seed passwords (`password123`) must be rotated before any shared
  deployment — seeding is gated to local dev.

## Verification matrix

| Check                              | Status |
|------------------------------------|--------|
| `tsc --noEmit` (apps/api)          | ✅ pass |
| `nest build` (apps/api)            | ✅ pass |
| `jest` (apps/api) — 2 suites       | ✅ 24/24 |
| `next lint` (apps/web)             | ✅ 0 errors |
| `next lint` (apps/admin)           | ✅ 0 errors |
| `eslint` (apps/api)                | ✅ 0 errors |
| `eslint` (apps/mobile)             | ✅ 0 errors |
| `turbo run lint`                   | ✅ 5/5 packages |
| Feature-flag factory smoke         | ✅ defaults / all-off / mixed |
