# --- Этап 1: Сборка фронтенда ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm install

# Копируем исходники и собираем
COPY frontend/ .
RUN npm run build


# --- Этап 2: Python + готовый dist ---
FROM python:3.10-slim

WORKDIR /app

# Python-зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Бэкенд
COPY src/ .

# Готовый dist из первого этапа
COPY --from=frontend-builder /app/frontend/dist /app/static

# Запуск
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]