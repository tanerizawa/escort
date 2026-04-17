# CloudFlare CDN Setup — ARETON.id
## Konfigurasi CloudFlare Free Tier

---

## 1. DNS Setup (CloudFlare Dashboard)

### Prerequisites
- CloudFlare account (free tier)
- Access domain registrar untuk areton.id

### Steps

1. **Add site di CloudFlare**: `areton.id`
2. **Update nameservers** di registrar ke CloudFlare nameservers
3. **DNS Records** (CloudFlare Dashboard → DNS):

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | areton.id | 72.61.143.92 | ☁️ Proxied | Auto |
| A | api | 72.61.143.92 | ☁️ Proxied | Auto |
| A | admin | 72.61.143.92 | ☁️ Proxied | Auto |
| CNAME | www | areton.id | ☁️ Proxied | Auto |

> **Important**: Set proxy status to "Proxied" (☁️ orange cloud) for DDoS protection and CDN.

---

## 2. SSL/TLS Configuration

### CloudFlare Dashboard → SSL/TLS

| Setting | Value |
|---------|-------|
| SSL mode | **Full (strict)** |
| Always Use HTTPS | ✅ ON |
| Minimum TLS Version | **TLS 1.2** |
| Opportunistic Encryption | ✅ ON |
| TLS 1.3 | ✅ ON |
| Automatic HTTPS Rewrites | ✅ ON |

> **Full (strict)** karena kita sudah punya Let's Encrypt SSL cert di origin server.

### Origin Certificate (Optional, recommended)
1. SSL/TLS → Origin Server → Create Certificate
2. Download cert (.pem) + private key
3. Install di Nginx sebagai tambahan validasi CloudFlare→Origin

---

## 3. Caching Configuration

### CloudFlare Dashboard → Caching → Configuration

| Setting | Value |
|---------|-------|
| Caching Level | **Standard** |
| Browser Cache TTL | **Respect Existing Headers** |
| Always Online | ✅ ON |

### Page Rules (Free tier: 3 rules)

**Rule 1**: Static assets (aggressive cache)
```
URL: areton.id/_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
Browser Cache TTL: 1 year
```

**Rule 2**: API no cache
```
URL: api.areton.id/*
Cache Level: Bypass
```

**Rule 3**: Admin no cache
```
URL: admin.areton.id/*
Cache Level: Bypass
```

---

## 4. Security Configuration

### CloudFlare Dashboard → Security

| Setting | Value |
|---------|-------|
| Security Level | **Medium** |
| Challenge Passage | 30 minutes |
| Browser Integrity Check | ✅ ON |

### WAF (Web Application Firewall)
- Enable managed rules (free tier has basic rules)
- Allow WebSocket connections for `api.areton.id/socket.io/*`

### Bot Management
- Bot Fight Mode: ✅ ON
- Super Bot Fight Mode: Configure (definitely automated → Block)

### DDoS
- Enabled by default on all CloudFlare plans

---

## 5. Performance Configuration

### CloudFlare Dashboard → Speed

| Setting | Value |
|---------|-------|
| Auto Minify (JS) | ✅ ON |
| Auto Minify (CSS) | ✅ ON |
| Auto Minify (HTML) | ✅ ON |
| Brotli | ✅ ON |
| Early Hints | ✅ ON |
| Rocket Loader | ❌ OFF (may break Next.js) |
| Mirage (images) | N/A (Pro only) |
| Polish (images) | N/A (Pro only) |

---

## 6. Nginx Configuration Updates

Setelah CloudFlare aktif, update Nginx untuk:
1. Trust CloudFlare IP ranges (get real client IP)
2. Restrict direct IP access (force through CloudFlare)

### Apply the nginx snippet:
```bash
sudo cp /srv/areton-id/infra/cloudflare-nginx.conf /etc/nginx/conf.d/cloudflare.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Firewall (iptables/ufw)

Restrict HTTP/HTTPS to CloudFlare IPs only:

```bash
# CloudFlare IPv4 ranges (as of 2024, verify at https://www.cloudflare.com/ips/)
# Allow CloudFlare IPs
sudo ufw allow from 173.245.48.0/20 to any port 443
sudo ufw allow from 103.21.244.0/22 to any port 443
sudo ufw allow from 103.22.200.0/22 to any port 443
sudo ufw allow from 103.31.4.0/22 to any port 443
sudo ufw allow from 141.101.64.0/18 to any port 443
sudo ufw allow from 108.162.192.0/18 to any port 443
sudo ufw allow from 190.93.240.0/20 to any port 443
sudo ufw allow from 188.114.96.0/20 to any port 443
sudo ufw allow from 197.234.240.0/22 to any port 443
sudo ufw allow from 198.41.128.0/17 to any port 443
sudo ufw allow from 162.158.0.0/15 to any port 443
sudo ufw allow from 104.16.0.0/13 to any port 443
sudo ufw allow from 104.24.0.0/14 to any port 443
sudo ufw allow from 172.64.0.0/13 to any port 443
sudo ufw allow from 131.0.72.0/22 to any port 443

# Keep SSH access
sudo ufw allow 22/tcp

# Deny all other inbound
# (Only do this when confirmed CloudFlare is working)
# sudo ufw deny 80/tcp
# sudo ufw deny 443/tcp
```

---

## 8. Verification

```bash
# Check CloudFlare is proxying
curl -sI https://areton.id | grep -i "cf-ray\|server"
# Should show: server: cloudflare, cf-ray: xxx

# Check API still works
curl -s https://api.areton.id/api/health | jq

# Check WebSocket still works (browser console)
# const ws = new WebSocket('wss://api.areton.id/socket.io/?EIO=4&transport=websocket')

# Check real IP reaches Nginx
tail -f /var/log/nginx/areton-access.log
# Should show real client IPs, not CloudFlare IPs
```

---

## 9. Monitoring

### CloudFlare Analytics (Dashboard → Analytics)
- Request volume
- Bandwidth saved (cached vs uncached)
- Threat analytics
- Performance (TTFB, page load)

### Workers (Optional, Free tier: 100K req/day)
Future use for:
- A/B testing
- Edge-side redirects
- API rate limiting at edge
- Image resizing

---

## Notes
- CloudFlare free tier includes: CDN, DDoS protection, SSL, 3 page rules, basic WAF
- WebSocket support is included on all plans
- gRPC is not available on free tier
- Upload limit: 100MB (free tier)
