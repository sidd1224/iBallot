# ------------------------------
# Stage 1 — Build the Vite app
# ------------------------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (clean & reproducible)
RUN npm ci

# Copy the rest of the project files
COPY . .

# 👇 add this build-time argument
ARG BUILD_MODE=production
ENV BUILD_MODE=${BUILD_MODE}

# 👇 use the mode variable here
RUN echo "🏗️  Building in mode=${BUILD_MODE:-production}" && npm run build -- --mode=${BUILD_MODE:-production} && ls -l && ls -l dist || true



# ------------------------------
# Stage 2 — Nginx serving layer
# ------------------------------
FROM nginx:alpine

# Copy built frontend assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx template config
COPY default.conf.template /etc/nginx/templates/default.conf.template

RUN sed -i 's/\r$//' /etc/nginx/templates/default.conf.template

# Cloud Run exposes $PORT
ENV PORT=8080

# Expose for local testing too
EXPOSE 8080

# ------------------------------
# 🧠 Final startup command
# Uses envsubst to inject PORT
# (Keeps $uri and all Nginx vars safe)
# ------------------------------
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && echo '----- Final Nginx Config -----' && cat /etc/nginx/conf.d/default.conf && echo '----- Starting Nginx -----' && nginx -t && nginx -g 'daemon off;'"]
