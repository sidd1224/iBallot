# === Stage 1: Build ===
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (production safe)
RUN npm ci

# Copy source code
COPY . .

# Pass API URL (you can override via Cloud Build arg if needed)
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app

# Build for production
RUN npm run build

# === Stage 2: Serve via Nginx ===
FROM nginx:alpine

# Copy the built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the nginx config template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run expects the container to listen on $PORT (defaults to 8080)
ENV PORT 8080

# Start Nginx using our template that binds to $PORT
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
