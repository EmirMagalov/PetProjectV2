# --- Этап 1: Сборка фронтенда на Node.js ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# --- Этап 2: Раздача через Nginx ---
FROM nginx:alpine
# Копируем скомпилированный фронтенд из первого этапа в папку Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html