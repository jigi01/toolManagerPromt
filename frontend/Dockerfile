# frontend/Dockerfile

# Этап 1: Сборка (Build)
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite соберет проект в папку dist
RUN npm run build

# Этап 2: Запуск Nginx
FROM nginx:alpine
# Копируем наш конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Копируем собранные файлы из этапа builder
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]