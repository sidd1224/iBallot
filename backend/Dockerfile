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

# No build step needed for backend


# --- Stage 3: Production Image ---
# ---!! FIX: Use Node 20 !!---
FROM node:20-alpine AS final

WORKDIR /app
ENV NODE_ENV production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser

# ✅ Copy all app files from builder
COPY --from=builder /app ./


# ✅ FIX: Ensure upload directories exist and have proper permissions
RUN mkdir -p /app/public/symbols /app/uploads \
    && chown -R appuser:nodejs /app/public /app/uploads

# ✅ Change ownership of everything to the app user
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 8080
CMD ["node", "server.js"]
