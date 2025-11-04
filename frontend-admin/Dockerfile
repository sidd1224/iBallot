# --- Stage 1: Build the Vite React app ---
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the full project and build
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy build output to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY default.conf.template /etc/nginx/conf.d/default.conf

# Cloud Run listens on 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
