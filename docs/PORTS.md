# Port & Origin Matrix

This repo has **two distinct port sets**: the one used by `next dev`
(fast local iteration) and the one used by `next start` in production
(PM2 / Docker). Keep CORS, OAuth callbacks and proxy rules aligned.

## 1. Matrix

| App   | `npm run dev` | `npm run start` / PM2 | Public hostname               |
|-------|---------------|------------------------|-------------------------------|
| API   | 4000          | 4000                   | `https://api.areton.id`       |
| Web   | **3000**      | **3003**               | `https://areton.id`           |
| Admin | **3001**      | **3005**               | `https://admin.areton.id`     |
| pgAdmin (optional) | 5050 | n/a             | internal only                 |

## 2. CORS

The API applies one allow-list to **both** HTTP (Express) and
**Socket.io** (`/chat`).

Resolution order:

1. If `CORS_ORIGINS` is set (comma-separated), it wins.
2. Otherwise the allow-list is:
   - `WEB_URL`   (default `http://localhost:3000`)
   - `ADMIN_URL` (default `http://localhost:3001`)
   - `http://localhost:3003`, `http://localhost:3005` (prod-like ports)

See `apps/api/src/main.ts` and `apps/api/src/modules/chat/chat.gateway.ts`.

### Recommended env values per environment

**Dev (local):** leave `CORS_ORIGINS` empty — defaults cover everything.

**Staging:**

```env
CORS_ORIGINS=https://staging.areton.id,https://admin-staging.areton.id
```

**Production:**

```env
CORS_ORIGINS=https://areton.id,https://admin.areton.id
```

## 3. OAuth callbacks

If you use Google OAuth (or Apple), register the callback URL for each
environment:

| Env   | Callback                                                      |
|-------|---------------------------------------------------------------|
| Dev   | `http://localhost:4000/api/auth/google/callback`              |
| Prod  | `https://api.areton.id/api/auth/google/callback`              |

## 4. Nginx snippets

See `infra/cloudflare-nginx.conf` for the production upstream
definitions. Summary:

```
location /api/      → http://127.0.0.1:4000
location /          → http://127.0.0.1:3003   (web)
server_name admin.areton.id → http://127.0.0.1:3005
```

Keep HTTP/1.1, `Upgrade`/`Connection` headers for the Socket.io path
`/chat`.
