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

## 4. “Partial” modules — finish these before GA

Each of these has a `TODO` or missing wiring that must be closed before
general availability:

- `chat` — end-to-end or at-rest message encryption (`ChatService`).
- `safety` — external escalation (SMS/PagerDuty) for SOS.
- `auth` — plug a real email + SMS provider for password reset / OTP.
- `notification` — confirm Brevo API keys and Firebase project wiring.
- `payment` — webhook reconciliation for each active gateway.
- mobile `MapScreen` — currently graceful-degrades when native maps are
  unavailable; pin a working native build.
- prisma seed — verified idempotent, but production seeds should be
  replaced with admin-only scripts.

## 5. Suggested rollout order

1. **Alpha / internal:** auth, user, booking, payment (sandbox), chat,
   review, notification (email), safety (SOS + incident), admin,
   health, metrics, kyc.
2. **Beta / closed market:** invoice, gdpr (if EU), matching.
3. **Public launch:** referral, premium, training, corporate, article,
   testimonial, analytics (platform dashboards).

## 6. Feature flag recommendations

Because NestJS `DynamicModule`s are trivial, optional modules should be
gated by env flags such as:

```
ENABLE_CORPORATE=false
ENABLE_TRAINING=false
ENABLE_PREMIUM=false
ENABLE_REFERRAL=false
ENABLE_ARTICLES=false
ENABLE_TESTIMONIALS=false
ENABLE_MATCHING=false
```

Add the flags in `ConfigModule`'s Joi schema and conditionally register
each module in `AppModule`. This keeps the codebase monolithic but the
runtime surface minimal for smaller markets.
