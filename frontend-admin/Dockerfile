# --- Stage 1: Build ---
# Use the official Node 18 image as a builder
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use npm ci (clean install) for production builds
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set the build-time argument for the API URL
# This will be passed in during the 'gcloud builds submit' or 'docker build' command
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Run the production build
RUN npm run build

# --- Stage 2: Serve ---
# Use a lightweight Nginx server
FROM nginx:stable-alpine

# Copy the built static files from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx config to handle React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
