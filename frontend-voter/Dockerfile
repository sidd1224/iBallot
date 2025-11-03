# --- Stage 1: Build ---
# Use Node 20
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# Install dependencies using 'npm ci' for production
RUN npm ci

COPY . .

# Pass the API URL as a build-time argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Run the build
RUN npm run build

# --- Stage 2: Serve ---
# Use a lightweight Nginx server
FROM nginx:stable-alpine
# Copy the built app from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy the Nginx config to handle React Router
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Expose port 80 (Cloud Run will map this)
EXPOSE 80

# --- FIXED CMD ---
# This command processes the .template file (which is needed for React Router)
# and then starts the Nginx server.
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

