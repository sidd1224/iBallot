# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Hardcode API for now
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template

# 🔥 Cloud Run expects 8080
EXPOSE 8080

# Use envsubst to inject $PORT dynamically
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
