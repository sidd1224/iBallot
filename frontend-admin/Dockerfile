# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine

# Copy built files to Nginx's web directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx config template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Expose the port Cloud Run expects
ENV PORT 8080

# Safe envsubst — replace only ${PORT}, not $uri etc.
CMD ["/bin/sh", "-c", "echo 'Contents of /usr/share/nginx/html:' && ls -R /usr/share/nginx/html && envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && echo '----- Final Nginx Config -----' && cat /etc/nginx/conf.d/default.conf && nginx -t && nginx -g 'daemon off;'"]