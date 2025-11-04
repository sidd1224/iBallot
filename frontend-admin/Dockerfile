# --- Stage 1: Build the Vite app ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy built files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Set the environment variable for Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Start Nginx with envsubst replacing ${PORT}
CMD ["/bin/sh", "-c", "echo 'Generating config...' && ls -R /etc/nginx && envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && echo '----- Final Nginx Config -----' && cat /etc/nginx/conf.d/default.conf && echo 'Starting nginx...' && nginx -g 'daemon off;'"]

