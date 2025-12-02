# ===================================================================
# Base image
# ===================================================================
FROM node:24-alpine AS base
RUN corepack enable pnpm
ENV PNPM_STORE_DIR=/tmp/pnpm-store

# ===================================================================
# Build Stage
# ===================================================================
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --store-dir /tmp/pnpm-store

COPY . .

# Gera drizzle.config.js para produção
RUN node scripts/build-drizzle-config.cjs

RUN pnpm run build

# ===================================================================
# Production Stage
# ===================================================================
FROM base AS production
WORKDIR /app

# IMPORTANTE: ativa SSL e modo produção no backend
ENV NODE_ENV=production
ENV IS_DOCKER=true

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
# Reaproveita node_modules já resolvidos no build (evita erro de chmod no cache do buildkit)
COPY --from=builder /app/node_modules ./node_modules

# Copia dist
COPY --from=builder /app/dist ./dist

# Copia drizzle.config.js (não .ts)
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js

# Copia banco (schemas + migrations)
COPY --from=builder /app/src/db ./src/db

# Copia entrypoint
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3333

ENTRYPOINT ["./docker-entrypoint.sh"]
