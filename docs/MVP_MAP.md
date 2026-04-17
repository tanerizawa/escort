# MVP Map

This document splits the platform into a minimum viable product (MVP)
and staged add-ons so the team can launch, operate and monetise in
phases instead of shipping every module at once.

## 1. Criteria

A module qualifies as **MVP** when all of the following are true:

1. Required to let a user register, browse, book, pay, chat, review.
2. Required to keep the platform legal/safe (KYC, safety, audit, admin
   moderation).
3. Required for day-one operability (health, metrics, notifications).

Anything else is **Phase 2+** and can be lazy-enabled per market.

## 2. MVP core (must-ship)

| Area             | Module(s)                          | Notes |
|------------------|------------------------------------|-------|
| Authentication   | `auth`                             | JWT + refresh, 2FA TOTP, OAuth helpers. Production needs real email/SMS providers. |
| Identity         | `user`, `kyc`                      | Client + escort profile, search, KYC workflow. |
| Core marketplace | `booking`                          | CRUD, state machine (PENDING → CONFIRMED → ONGOING → COMPLETED → CANCELLED), promo validation, reschedule, refund-claim. |
| Money            | `payment`, `invoice`               | Escrow, release, refund, tips, cancellation fees, withdrawal. Pick **one** gateway first. |
| Conversation     | `chat`                             | Socket.io + REST. TODO: message encryption before launch if handling sensitive content. |
| Trust            | `review`, `safety`                 | Reviews/replies; SOS + incident reports + live GPS tracking. |
| Notifications    | `notification`                     | In-app + one email provider (Brevo). Push/WhatsApp optional. |
| Ops              | `admin`, `health`, `metrics`       | Dashboard, user/escort moderation, disputes, audit. |

## 3. Secondary modules (Phase 2+)

Ship once MVP is stable and traffic justifies the extra surface.

| Module        | Why it's Phase 2 |
|---------------|------------------|
| `corporate`   | B2B billing — not needed for consumer launch. |
| `training`    | LMS-style flows; unblock after escort onboarding proves stable. |
| `premium`     | Featured listings — revenue lever once supply/demand exists. |
| `referral`    | Growth lever, depends on notifications infra. |
| `article`     | CMS/blog — SEO optimisation, not a blocker. |
| `testimonial` | Curated social proof — duplicates `review` early on. |
| `analytics`   | Platform-level dashboards — useful later, noisy early. |
| `matching`    | Heuristic scoring; `/escorts` search is enough for MVP. |
| `gdpr`        | Required in EU markets. Gate by region. |

## 4. “Partial” modules — status

| Area | Status |
|------|--------|
| `chat` message encryption | ✅ Implemented — AES-256-GCM at rest via `EncryptionService`, read path uses `decryptSafe` for pre-encryption rows. |
| `safety` SOS admin escalation | ✅ Implemented — `NotificationService.notifyAdmins(..., { severity: 'CRITICAL' })` adds WhatsApp escalation via Twilio when configured; severity ≥4 incidents escalate too. |
| `auth` email reset | ✅ Wired — `EmailService` (Brevo) delivers reset links; MOCK mode when `BREVO_API_KEY` missing. |
| `auth` OTP delivery | ✅ Wired — `WhatsAppService.sendOTP` invoked from `AuthService.sendOTP`; MOCK mode when Twilio unconfigured. |
| `notification` provider preflight | ✅ Implemented — startup warns when Brevo / Firebase / Twilio keys are missing. |
| `payment` webhook reconciliation | 🟡 Each gateway has a webhook endpoint; confirm signature verification is on before enabling live credentials. |
| mobile `MapScreen` | 🟡 Graceful degradation in place; pin a native build before GA. |
| Prisma seed | ✅ Single idempotent `prisma/seed.ts`; production seeds are separate admin-only scripts. |

## 5. Suggested rollout order

1. **Alpha / internal:** auth, user, booking, payment (sandbox), chat,
   review, notification (email), safety (SOS + incident), admin,
   health, metrics, kyc.
2. **Beta / closed market:** invoice, gdpr (if EU), matching.
3. **Public launch:** referral, premium, training, corporate, article,
   testimonial, analytics (platform dashboards).

## 6. Feature flags (implemented)

Phase 2+ modules are now gated at the `AppModule` level. Every flag
defaults to `true` so existing deployments keep their current behaviour.
Set the env var to `false` / `0` / `no` / `off` to unload the module
(routes disappear from the API entirely).

| Env var                 | Module            |
|-------------------------|-------------------|
| `ENABLE_MATCHING`       | `MatchingModule`       |
| `ENABLE_CORPORATE`      | `CorporateModule`      |
| `ENABLE_TRAINING`       | `TrainingModule`       |
| `ENABLE_PREMIUM`        | `PremiumModule`        |
| `ENABLE_REFERRAL`       | `ReferralModule`       |
| `ENABLE_ARTICLES`       | `ArticleModule`        |
| `ENABLE_TESTIMONIALS`   | `TestimonialModule`    |
| `ENABLE_GDPR`           | `GdprModule`           |
| `ENABLE_ANALYTICS`      | `AnalyticsModule`      |

Effective flags are logged at startup:

```
[Bootstrap] Feature flags — enabled: [matching, corporate, ...]
[Bootstrap] Feature flags — disabled: [testimonials, articles]
```

Implementation lives in `apps/api/src/app.module.ts` (module gating)
and `apps/api/src/config/features.config.ts` (typed ConfigService
accessor via `configService.get<Record<string, boolean>>('features')`).
