# Troubleshooting

## Startup

- **`ENCRYPTION_KEY is required`** — set `ENCRYPTION_KEY` in `.env`.
  Minimum 16 chars in dev, 32 in production.
- **`DATABASE_URL required`** — Joi validation blocks startup; copy
  `.env.example` and fill it in.
- **`ValidationError: JWT_ACCESS_SECRET`** — required in production.
  Non-production falls back to defaults, but avoid shipping those.

## Prisma

- **`The table public.x does not exist`** — run `npm run db:migrate`.
- **`PrismaClientInitializationError: Can't reach database server`** —
  `docker compose -f docker/docker-compose.yml ps` to confirm Postgres
  is up; verify `DATABASE_URL`.
- **`Missing ts-node`** when seeding — run `npm install` at the repo
  root (ts-node is a dev-dep in `apps/api`).

## CORS / Socket.io

- **Browser console: `CORS preflight did not succeed`** — set
  `CORS_ORIGINS` to include the browser origin or update `WEB_URL` /
  `ADMIN_URL`. Dev defaults cover `localhost:3000/3001/3003/3005`.
- **Socket.io handshake 400 / Bad Request** — the `/chat` namespace now
  shares the same allow-list via `CORS_ORIGINS`; ensure it's set
  consistently for HTTP and Socket.io clients.

## Ports

- Web devs on **3000**, admin devs on **3001**, PM2 prod on **3003 /
  3005** — see [`PORTS.md`](./PORTS.md). A 404 from Nginx often means
  the upstream port is wrong.

## Mobile

- **Android build fails with missing node** — export `NODE_BINARY`
  pointing to the absolute path of your `node` executable before
  running `./gradlew assembleDebug`.
- **`react-native-maps` not found** — `MapScreen` gracefully degrades;
  install the native module or pin the Expo version listed in
  `apps/mobile/package.json`.

## Uploads

- **404 on `/uploads/...`** — the API serves statics only when the
  `uploads/` directory exists at the API's CWD. Create it or change
  `ServeStaticModule.forRoot({ rootPath: ... })`.

## Swagger

- **Swagger returns 404 in production** — intentional. Swagger is only
  mounted when `NODE_ENV !== 'production'`.

## Payments

- **Gateway returns "no credentials"** — fill the relevant env vars
  (`DOKU_*`, `XENDIT_*`, etc.); the payment service no-ops with a
  log warning when keys are absent.
- **Webhook 400 / unexpected fields** — some gateways post free-form
  keys. Relax the DTO or disable `forbidNonWhitelisted` per webhook
  route; do **not** disable it globally.

## Tests

- **UAT script fails on the very first request** — the API must be
  fully migrated + seeded before running `scripts/uat-test.sh`.
