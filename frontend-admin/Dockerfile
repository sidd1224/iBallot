# =======================================
# STAGE 1 — Build the Vite React App
# =======================================
FROM node:18-alpine AS build
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm ci

# Copy all source code and build the app
COPY . .
RUN npm run build

# =======================================
# STAGE 2 — Serve with Nginx
# =======================================
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy built frontend from previous stage
COPY --from=build /app/dist .

# Copy dynamic Nginx template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Install envsubst to dynamically inject environment variables
RUN apk add --no-cache gettext

# Expose container port
EXPOSE 8080

# Use envsubst to dynamically replace VITE_API_URL before starting Nginx
CMD ["/bin/sh", "-c", "envsubst '$VITE_API_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
