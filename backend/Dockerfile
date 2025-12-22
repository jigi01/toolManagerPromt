# backend/Dockerfile

# Используем легкий образ Node.js
FROM node:20-alpine

# Рабочая папка внутри контейнера
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости (npm ci быстрее и надежнее для CI/CD)
RUN npm ci

# Копируем схему призмы (важно для генерации клиента)
COPY prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем остальной код
COPY . .

# Открываем порт (для информации, реально открывает docker-compose)
EXPOSE 5001

# Команда запуска: Сначала накатываем миграции, потом запускаем сервер
CMD npx prisma migrate deploy && node src/server.js