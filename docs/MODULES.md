# Modules & Routes Reference

A single page with every NestJS module, every Next.js route and every
mobile screen in the repo.

## 1. NestJS modules (`apps/api/src/modules`)

| Module       | Purpose |
|--------------|---------|
| `auth`       | Register, login, JWT refresh, password reset, 2FA TOTP, Google/Apple OAuth helpers, session/device management. |
| `user`       | Client + escort profiles, favourites, certifications, search, availability. |
| `booking`    | Booking CRUD, state machine, reschedule, cancel, promo validation, refund-claim. |
| `payment`    | Escrow, release, refund, tips, cancellation fees, withdrawal, multi-gateway (Xendit/DOKU/Midtrans/NOWPayments). |
| `invoice`    | Invoice listing + generation tied to payments. |
| `chat`       | REST + Socket.io gateway (`/chat` namespace) for messaging, typing, presence, read receipts. |
| `notification` | In-app notifications, email (Brevo), push (Firebase), WhatsApp (Twilio). |
| `review`     | Post-booking reviews, sub-scores, replies, flagging. |
| `safety`     | SOS, incident reports (with evidence upload), live GPS tracking in Redis, geofencing, late alerts. |
| `admin`      | Dashboard, user/escort moderation, disputes, finance, promos, audit logs, live booking monitoring. |
| `kyc`        | KYC verification workflow (eKYC provider integration). |
| `matching`   | Ranked escort recommendations. |
| `corporate`  | B2B corporate subscriptions and members. |
| `training`   | Training modules + progress tracking for escorts. |
| `premium`    | Paid placement / premium listings. |
| `referral`   | Referral codes and rewards. |
| `article`    | CMS-style blog / articles. |
| `testimonial`| Curated testimonials. |
| `analytics`  | Platform + user analytics aggregation. |
| `gdpr`       | Data subject requests / export tooling. |
| `image`      | Upload pipelines + served statics at `/uploads`. |
| `metrics`    | Prometheus HTTP metrics + interceptor. |
| `health`     | Liveness / readiness endpoints. |

Also present but not Nest modules:

- `apps/api/src/modules/common-dto.ts` — shared DTO classes imported by
  safety / notification controllers.

## 2. Web client routes (`apps/web/src/app`)

### Public / marketing

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/about`, `/how-it-works`, `/faq`, `/contact` | Marketing |
| `/safety`, `/testimonials` | Trust pages |
| `/privacy`, `/terms` | Legal |
| `/blog`, `/blog/[slug]` | Articles (API-backed) |
| `/download` | Android APK download |
| `/escorts`, `/escorts/[id]` | Browse & profile |
| `/robots.ts`, `/sitemap.ts` | SEO |
| `/geocode` (route handler) | Geocoding proxy |

### Auth group

```
/(auth)/login
/(auth)/register
/(auth)/register/escort
/(auth)/forgot-password
/(auth)/reset-password
/(auth)/verify-email
/(auth)/otp
/(auth)/callback/google
```

### Client persona (`/user/*`)

| Path | Purpose |
|------|---------|
| `/user/dashboard` | Client home |
| `/user/discover`, `/user/escorts`, `/user/escorts/[id]` | Browse & profiles |
| `/user/bookings`, `/user/bookings/new`, `/user/bookings/[id]` | Booking list + detail |
| `/user/bookings/[id]/review`, `/user/bookings/[id]/tracking` | Review submission + live GPS |
| `/user/chat`, `/user/chat/[bookingId]` | Client chat |
| `/user/favorites`, `/user/gallery` | Saved escorts / gallery |
| `/user/payments`, `/user/payments/checkout`, `/user/payments/status`, `/user/payments/[id]/status`, `/user/payments/[id]/invoice` | Payments lifecycle |
| `/user/profile`, `/user/profile/security`, `/user/profile/verification` | Profile + security + KYC |
| `/user/preferences`, `/user/privacy`, `/user/notifications`, `/user/notifications/settings` | Settings |
| `/user/referral`, `/user/contest`, `/user/contest/[id]`, `/user/hall-of-fame` | Loyalty / engagement |
| `/user/report`, `/user/safety` | Safety hub |

### Escort persona (`/escort/*`)

| Path | Purpose |
|------|---------|
| `/escort/dashboard` | Escort home |
| `/escort/profile`, `/escort/calendar` | Profile + availability |
| `/escort/requests`, `/escort/bookings/[id]` | Incoming / ongoing bookings |
| `/escort/earnings`, `/escort/analytics` | Financial + performance |
| `/escort/chat`, `/escort/chat/[bookingId]` | Escort chat |
| `/escort/reviews`, `/escort/notifications` | Feedback + notifications |

## 3. Admin routes (`apps/admin/src/app`)

| Path | Purpose |
|------|---------|
| `/` | Admin login / entry |
| `/dashboard` | Platform metrics |
| `/users`, `/users/[id]` | User management |
| `/users/kyc`, `/users/kyc/[id]` | KYC review |
| `/escorts/pending`, `/escorts/[id]` | Escort moderation |
| `/bookings` | All bookings |
| `/disputes` | Disputes |
| `/incidents` | Safety incidents |
| `/monitoring`, `/monitoring/[id]` | Live booking monitoring |
| `/finance` | Financial summary |
| `/promo-codes` | Promo CRUD |
| `/referrals`, `/premium`, `/corporate`, `/training`, `/articles`, `/testimonials` | Feature admin |
| `/analytics` | Platform analytics |
| `/audit-logs` | Security audit trail |
| `/data-requests` | GDPR queue |
| `/notifications` | Admin broadcasts |
| `/settings` | Platform config |

## 4. Mobile screens (`apps/mobile/src/screens`)

| Group  | Screen |
|--------|--------|
| Auth   | `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen` |
| Client | `HomeScreen`, `EscortDetailScreen`, `BookingCreateScreen`, `ClientBookingsScreen`, `FavoritesScreen`, `PaymentScreen` |
| Escort | `EscortDashboardScreen`, `EscortRequestsScreen` |
| Common | `ChatListScreen`, `ChatScreen`, `BookingDetailScreen`, `ReviewScreen`, `ProfileScreen`, `EditProfileScreen`, `SecurityScreen`, `NotificationsScreen`, `MapScreen`, `SOSScreen` |

`MapScreen` gracefully degrades when `react-native-maps` is not
available (sandboxed fallback UI) — pin a native build before production.
