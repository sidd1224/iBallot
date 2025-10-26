# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL must be passed in during the Cloud Build step
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

# Install 'gettext' which provides 'envsubst' to substitute env variables
RUN apk add --no-cache gettext

# Copy the built app from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the Nginx config *template*
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

EXPOSE 8080

# Run a startup script:
# 1. 'envsubst' reads the template, substitutes ${PORT} with the env variable,
#    and outputs the result to the real config file.
# 2. 'nginx' starts in the foreground.
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

