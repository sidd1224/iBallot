# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Hardcoded API URL (or use ARG if you prefer)
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app
RUN npm run build

# --- Stage 2: Nginx ---
FROM nginx:alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx config template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Use envsubst to substitute the $PORT variable and start nginx
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
