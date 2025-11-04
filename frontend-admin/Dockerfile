# --- Stage 1: Build the app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run expects container to listen on $PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

# Use envsubst to inject the port and start Nginx
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && echo '----- Final Nginx Config -----' && cat /etc/nginx/conf.d/default.conf && echo '----- Starting Nginx -----' && nginx -g 'daemon off;'"]
