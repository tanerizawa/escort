# API Guide

## 1. Conventions

- Base URL (prod): `https://api.areton.id/api`
- Base URL (dev): `http://localhost:4000/api`
- Global prefix: **`/api`** (see `main.ts`).
- Responses wrapped by `TransformInterceptor`:

  ```json
  { "success": true, "data": { … }, "timestamp": "ISO-8601" }
  ```

- Errors normalised by `HttpExceptionFilter`:

  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "validation error",
    "errors": [ ... ]
  }
  ```

## 2. Auth

- `POST /api/auth/register`
- `POST /api/auth/login`  → returns `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` (Bearer refresh token)
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password` / `POST /api/auth/reset-password`
- `POST /api/auth/2fa/setup` / `POST /api/auth/2fa/verify`
- `GET  /api/auth/google` / `/api/auth/google/callback`

Authenticated requests: `Authorization: Bearer <accessToken>`.

## 3. Rate limiting

Applied globally via `ThrottlerGuard` with three buckets:

| Name   | Window  | Limit |
|--------|---------|-------|
| short  | 1s      | 3     |
| medium | 10s     | 20    |
| long   | 60s     | 100   |

Use `@SkipThrottle()` / `@Throttle({ … })` on webhook routes if your
provider requires burst traffic.

## 4. Swagger

Available at `http://localhost:4000/api/docs` whenever
`NODE_ENV !== 'production'`. Do **not** expose it to the public internet
in production.

## 5. Feature routes (summary)

| Area          | Base path            |
|---------------|----------------------|
| Auth          | `/api/auth/*`        |
| Users/profile | `/api/users/*`       |
| Escorts       | `/api/escorts/*`     |
| Bookings      | `/api/bookings/*`    |
| Payments      | `/api/payments/*`    |
| Invoices      | `/api/invoices/*`    |
| Chat (REST)   | `/api/chat/*`        |
| Notifications | `/api/notifications/*` |
| Reviews       | `/api/reviews/*`     |
| Safety        | `/api/safety/*`      |
| KYC           | `/api/kyc/*`         |
| Matching      | `/api/matching/*`    |
| Admin         | `/api/admin/*`       |
| Health        | `/api/health`        |
| Metrics       | `/api/metrics`       |

See Swagger for detailed DTOs.

## 6. Safety / SOS

Because `ValidationPipe` uses `forbidNonWhitelisted: true`, the `POST
/api/safety/sos` payload explicitly accepts:

```json
{
  "bookingId": "uuid",
  "description": "optional",
  "type": "SOS",
  "severity": 5,
  "lat": -6.2,
  "lng": 106.8
}
```

Optional GPS fields are recorded into Redis location cache and audit
trail. Mobile app uses `POST /api/safety/sos` from `SOSScreen.tsx`.

## 7. Socket.io

- Namespace: **`/chat`**
- Connect with `{ auth: { token: <JWT access token> } }` or
  `Authorization: Bearer <JWT>` header.
- Events:

  | Event            | Direction       | Payload                                         |
  |------------------|-----------------|-------------------------------------------------|
  | `join:room`      | client → server | `{ bookingId }`                                 |
  | `leave:room`     | client → server | `{ bookingId }`                                 |
  | `send:message`   | client → server | `{ bookingId, content, type? }`                 |
  | `typing:start`   | client → server | `{ bookingId }`                                 |
  | `typing:stop`    | client → server | `{ bookingId }`                                 |
  | `mark:read`      | client → server | `{ bookingId }`                                 |
  | `new:message`    | server → room   | persisted message + `bookingId`                 |
  | `user:online`    | server → all    | `{ userId }`                                    |
  | `user:offline`   | server → all    | `{ userId }`                                    |
  | `user:joined`    | server → room   | `{ userId, userName }`                          |
  | `user:left`      | server → room   | `{ userId }`                                    |
  | `typing:indicator` | server → room | `{ userId, userName, isTyping }`                |
  | `messages:read`  | server → room   | `{ bookingId, readBy, count }`                  |
  | `error`          | server → client | `{ event, message }`                            |

- Chat is only allowed when `booking.status ∈ {PENDING, CONFIRMED, ONGOING}`.

## 8. Webhooks

Payment gateways post to (no auth guard, signature-verified inside the
service):

- `POST /api/payments/webhook/doku`
- `POST /api/payments/webhook/xendit`
- `POST /api/payments/webhook/midtrans`
- `POST /api/payments/webhook/nowpayments`

Disable `forbidNonWhitelisted` per route or keep DTOs permissive
for third-party payload shapes.

## 9. CORS

- `CORS_ORIGINS` (comma-separated) overrides the default allow-list.
- Defaults include `WEB_URL`, `ADMIN_URL`, `localhost:3003`,
  `localhost:3005`.
- Same list applies to the Socket.io gateway (see
  `chat.gateway.ts`).

See [`PORTS.md`](./PORTS.md) for the port/origin matrix.
