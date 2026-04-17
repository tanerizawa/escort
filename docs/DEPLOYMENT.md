# Deployment

## 1. Topologies supported in this repo

- **Single VPS + PM2** (defined by `ecosystem.config.js`).
- **Docker** (images defined in `docker/` and `apps/api/Dockerfile`).
- **Cloudflare → Nginx → Node** (configs in `infra/`).

## 2. PM2 (VPS)

`ecosystem.config.js` defines three processes:

| Name            | Port | Working directory |
|-----------------|------|-------------------|
| `areton-api`    | 4000 | `apps/api` (runs `dist/main.js`) |
| `areton-web`    | 3003 | `apps/web`  (runs `next start --port 3003`) |
| `areton-admin`  | 3005 | `apps/admin` (runs `next start --port 3005`) |

Recommended flow:

```bash
# on the VPS
git pull
npm ci
npm run build
npm run db:migrate
pm2 startOrReload ecosystem.config.js
pm2 save
```

## 3. Docker

```bash
# Build API image
docker build -f docker/Dockerfile.api -t areton-api:latest .

# Production compose (Postgres + Redis + API)
docker compose -f docker/docker-compose.production.yml up -d
```

The web and admin apps are deployed as Node processes via PM2 in the
same VM (they are Next.js standalone-capable if you prefer separate
images).

## 4. Nginx + Cloudflare

See [`infra/CLOUDFLARE_SETUP.md`](../infra/CLOUDFLARE_SETUP.md) for the
full Cloudflare setup. The Nginx snippet is at
[`infra/cloudflare-nginx.conf`](../infra/cloudflare-nginx.conf). Copy it
with:

```bash
sudo cp /srv/areton-id/infra/cloudflare-nginx.conf \
        /etc/nginx/conf.d/cloudflare.conf
sudo nginx -t && sudo systemctl reload nginx
```

Make sure to keep HTTP/1.1 + `Upgrade` / `Connection` headers on
`/chat` to support Socket.io.

## 5. Observability

- `infra/monitoring/docker-compose.yml` starts Prometheus + Grafana.
- API exposes `/api/metrics` (Prometheus format).
- Health endpoint: `/api/health`.

## 6. Rollback

- Keep the last two PM2 releases (`pm2 ls` + `pm2 reload`).
- Prisma migrations are **not** reversible by default — keep a tested
  DB restore path (`scripts/db-backup.sh`).

## 7. Hardening checklist

- [ ] TLS only (Cloudflare → origin).
- [ ] `CORS_ORIGINS` locked to your production domains.
- [ ] `NODE_ENV=production` (disables Swagger and enforces strong keys).
- [ ] `ENCRYPTION_KEY` ≥32 chars.
- [ ] `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` set.
- [ ] Gateway API keys in environment, **not** in scripts.
- [ ] DB backups scheduled + restore drilled.
- [ ] Sentry / log aggregation wired.
- [ ] Rate-limit exemptions applied to webhooks only.
