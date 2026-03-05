# ─────────────────────────────────────────────
# ARETON.id API — Production Dockerfile
# ─────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config files
COPY package*.json turbo.json ./

# Copy workspace packages
COPY apps/api/package*.json apps/api/
COPY packages/shared-types/package*.json packages/shared-types/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/api/ apps/api/
COPY packages/shared-types/ packages/shared-types/

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build API
RUN npx turbo run build --filter=@areton/api

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Prisma client needs node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
