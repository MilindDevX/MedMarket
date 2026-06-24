# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install deps first (layer caches unless package.json/pnpm-lock.yaml changes)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source and generate Prisma client
COPY prisma ./prisma
RUN pnpm exec prisma generate

# Copy remaining source and build
COPY . .
RUN pnpm run build


# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Only production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy Prisma schema + generated client (needed at runtime for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
