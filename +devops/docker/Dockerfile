# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm check
RUN pnpm build

# ============================================
# Stage 3: Production (nginx serving static files)
# ============================================
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY +devops/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1
