# Environment Variables

All environment variables are validated by the API's `ConfigModule`
(Joi schema in `apps/api/src/app.module.ts`). Missing required values
prevent startup.

The canonical template is [`.env.example`](../.env.example) at the repo
root. Each variable below is annotated with who consumes it.

## 1. App

| Variable                      | Consumer        | Notes |
|-------------------------------|-----------------|-------|
| `NODE_ENV`                    | API, web, admin | `development` / `production` / `test`. |
| `PORT`                        | API             | Defaults to 4000. |
| `API_URL`                     | Web, admin, mobile | Public-facing API URL. |
| `WEB_URL`                     | API (CORS)      | Default dev origin for web. |
| `ADMIN_URL`                   | API (CORS)      | Default dev origin for admin. |
| `CORS_ORIGINS`                | API (CORS + Socket.io) | Comma-separated override of allowed origins. |
| `ENABLE_PAYMENT_MOCK`         | API             | Short-circuit gateways to succeed. |
| `NEXT_PUBLIC_ENABLE_PAYMENT_MOCK` | Web           | Same flag exposed to the browser. |

## 2. Database & cache

| Variable         | Consumer | Notes |
|------------------|----------|-------|
| `DATABASE_URL`   | API      | Prisma connection string. **Required.** |
| `REDIS_HOST`     | API      | Defaults to `localhost`. |
| `REDIS_PORT`     | API      | Defaults to `6379`. |
| `REDIS_PASSWORD` | API      | Optional. |

## 3. Auth

| Variable              | Consumer | Notes |
|-----------------------|----------|-------|
| `JWT_ACCESS_SECRET`   | API      | Required in production. |
| `JWT_REFRESH_SECRET`  | API      | Required in production. |
| `JWT_ACCESS_EXPIRY`   | API      | e.g. `15m`. |
| `JWT_REFRESH_EXPIRY`  | API      | e.g. `7d`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | API | Google OAuth. |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | API | Apple Sign-in. |

## 4. KYC / eKYC

| Variable               | Consumer |
|------------------------|----------|
| `EKYC_API_KEY`         | API      |
| `EKYC_API_URL`         | API      |
| `EKYC_ENCRYPTION_KEY`  | API      |

## 5. Payments

| Variable | Consumer | Gateway |
|----------|----------|---------|
| `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN` | API | Xendit |
| `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` | API | Crypto |
| `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_PUBLIC_KEY` | API | DOKU |

Only wire up the gateway(s) you actually use. Leave the rest blank; the
payment service no-ops on missing credentials.

## 6. Infrastructure integrations

| Variable | Consumer | Provider |
|----------|----------|----------|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | API | S3-compatible storage |
| `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` | API | Push notifications |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER` | API | SMS / WhatsApp |
| `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | API | Transactional email |
| `GOOGLE_MAPS_API_KEY` | web, mobile | Maps |
| `SENTRY_DSN`          | API, web, admin | Optional error tracking |

## 7. Encryption

| Variable          | Consumer | Notes |
|-------------------|----------|-------|
| `ENCRYPTION_KEY`  | API      | ≥16 chars in dev, ≥32 chars in production. Used for AES-256-GCM PII + chat encryption. **No default** — startup fails if missing. |

## 8. Feature flags (Phase 2+)

All default to `true`. Set to `false`/`0`/`no`/`off` to unload the module at startup.

| Variable | Module disabled when false |
|----------|----------------------------|
| `ENABLE_MATCHING` | `MatchingModule` |
| `ENABLE_CORPORATE` | `CorporateModule` |
| `ENABLE_TRAINING` | `TrainingModule` |
| `ENABLE_PREMIUM` | `PremiumModule` |
| `ENABLE_REFERRAL` | `ReferralModule` |
| `ENABLE_ARTICLES` | `ArticleModule` |
| `ENABLE_TESTIMONIALS` | `TestimonialModule` |
| `ENABLE_GDPR` | `GdprModule` |
| `ENABLE_ANALYTICS` | `AnalyticsModule` |

## 8. Environment lifecycle

- Root `.env` is also auto-loaded by the API
  (`envFilePath: ['.env', '../../.env']`).
- Secrets **must never** be committed. `.gitignore` already excludes
  `.env*` except `.env.example`.
- Rotate all demo credentials (`password123`, seed accounts) before
  exposing any deployment.
