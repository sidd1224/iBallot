# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Hardcode backend URL for now (fine)
ENV VITE_API_URL=https://iballot-backend-715732606815.asia-south1.run.app

RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the template that will use Cloud Run’s $PORT
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run expects your container to listen on $PORT (default 8080)


EXPOSE 80

# Run nginx using the envsubst trick to replace ${PORT}
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
