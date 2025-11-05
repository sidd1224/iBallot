# ------------------------------
# Stage 1 — Build the Vite app
# ------------------------------
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 👇 add this build-time argument
ARG BUILD_MODE=production
ENV BUILD_MODE=${BUILD_MODE}

# 👇 use the mode variable here
RUN echo "🏗️  Building in mode=$BUILD_MODE" && npm run build -- --mode=$BUILD_MODE


# ------------------------------
# Stage 2 — Nginx serving layer
# ------------------------------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template
RUN sed -i 's/\r$//' /etc/nginx/templates/default.conf.template

ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
