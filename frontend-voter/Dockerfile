# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Hardcode backend API URL
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app

RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy fixed Nginx config
COPY default.conf.template /etc/nginx/templates/default.conf.template


EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
