# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer caches unless package.json changes)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy remaining source and build
COPY . .
RUN npm run build


# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema + generated client (needed at runtime for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
