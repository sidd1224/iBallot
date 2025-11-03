# --- Stage 1: Build ---
# ---!! FIX: Use Node 20 to match your dependencies !!---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# Install dependencies using 'npm ci' for production
RUN npm ci

COPY . .

# Pass the API URL as a build-time argument
ARG VITE_API_URL
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app

# Run the build
RUN npm run build

# --- Stage 2: Serve ---
# Use a lightweight Nginx server
FROM nginx:stable-alpine
# Copy the built app from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy the Nginx config to handle React Router
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

