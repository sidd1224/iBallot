# --- Stage 1: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Expose the port Cloud Run expects
ENV PORT=8080
EXPOSE 8080

# Safe envsubst — replace only ${PORT}, not $uri etc.
CMD ["/bin/sh", "-c", "sed 's/\\${PORT}/'$PORT'/g' /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -t && nginx -g 'daemon off;'"]
