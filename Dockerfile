# --- Этап 1: Сборка фронтенда (Vue / Vite) ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Копируем файлы зависимостей и устанавливаем их
COPY frontend/package*.json ./
RUN npm install

# Копируем остальной фронтенд и собираем проект
COPY frontend/ .
RUN npm run build


# --- Этап 2: Финальный образ с бэкендом (Python) ---
FROM python:3.10-slim
WORKDIR /app

# Устанавливаем Python-зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем бэкенд
COPY src/ .

# Копируем скомпилированный фронтенд из первого этапа
# (путь назначения зависит от того, откуда ваш FastAPI отдает статичные файлы)
COPY --from=frontend-builder /app/frontend/dist /app/static

# Запускаем сервер
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]