# --- Stage 1: Build Dependencies ---
# ---!! FIX: Use Node 20 !!---
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Install *only* production dependencies
RUN npm ci --omit=dev

# --- Stage 2: Build Application ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No build step needed for this backend

# --- Stage 3: Production Image ---
# ---!! FIX: Use Node 20 !!---
FROM node:20-alpine AS final

WORKDIR /app
ENV NODE_ENV production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app ./
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 8080
CMD [ "node", "server.js" ]

