# 🎯 Шпаргалка: Команды ToolManager

## ⚡ Быстрое обновление (TL;DR)

```bash
# Резервная копия (ОБЯЗАТЕЛЬНО!)
docker exec toolmanager_postgres pg_dump -U postgres toolmanager > backup.sql

# Обновление
cd backend && npm install && npx prisma migrate deploy && npx prisma generate
cd ../frontend && pnpm install

# Запуск
cd ../backend && npm run dev  # терминал 1
cd ../frontend && pnpm dev    # терминал 2
```

---

## 🗄️ База данных

### Управление Docker
```bash
# Запуск БД
docker compose up -d

# Остановка БД
docker compose down

# Логи БД
docker logs toolmanager_postgres

# Перезапуск БД
docker compose restart
```

### Резервное копирование
```bash
# Создать backup
docker exec toolmanager_postgres pg_dump -U postgres toolmanager > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить backup
docker exec -i toolmanager_postgres psql -U postgres toolmanager < backup.sql
```

### Prisma команды
```bash
cd backend

# Применить миграции
npx prisma migrate deploy

# Создать новую миграцию
npx prisma migrate dev --name название_миграции

# Сгенерировать клиент
npx prisma generate

# Открыть Prisma Studio (GUI)
npx prisma studio

# Сбросить БД (ОПАСНО! Удалит все данные)
npx prisma migrate reset

# Проверить статус
npx prisma migrate status
```

---

## 🔧 Backend

### Установка и запуск
```bash
cd backend

# Установка зависимостей
npm install

# Режим разработки (с автоперезагрузкой)
npm run dev

# Обычный запуск
npm start

# Переустановка bcrypt (если проблемы)
npm rebuild bcrypt
```

### Проверка работоспособности
```bash
# Health check
curl http://localhost:5000/api/health

# Получить категории (с авторизацией)
curl http://localhost:5000/api/categories -b cookies.txt

# Получить инструменты
curl http://localhost:5000/api/tools -b cookies.txt
```

### Логи
```bash
# Если backend запущен в фоне
tail -f /tmp/backend.log

# Или просто смотрите вывод в терминале
```

---

## 🎨 Frontend

### Установка и запуск
```bash
cd frontend

# Установка зависимостей (выберите один)
pnpm install  # рекомендуется
npm install
yarn install

# Режим разработки
pnpm dev
npm run dev
yarn dev

# Сборка для production
pnpm build
npm run build
yarn build

# Предпросмотр production сборки
pnpm preview
```

### Очистка кэша
```bash
# Удалить node_modules и переустановить
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Очистить кэш Vite
rm -rf .vite
```

---

## 🔌 API Категорий

### Получение
```bash
# Все категории
curl -X GET http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Конкретная категория
curl -X GET http://localhost:5000/api/categories/CATEGORY_ID \
  -b cookies.txt
```

### Создание
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Электроинструмент"}'
```

### Обновление
```bash
curl -X PUT http://localhost:5000/api/categories/CATEGORY_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Новое название"}'
```

### Удаление
```bash
curl -X DELETE http://localhost:5000/api/categories/CATEGORY_ID \
  -b cookies.txt
```

---

## 🔧 API Инструментов

### Получение
```bash
# Все инструменты
curl -X GET http://localhost:5000/api/tools -b cookies.txt

# Фильтр по категории
curl -X GET "http://localhost:5000/api/tools?categoryId=CATEGORY_ID" \
  -b cookies.txt

# Фильтр по статусу
curl -X GET "http://localhost:5000/api/tools?status=AVAILABLE" \
  -b cookies.txt

# Конкретный инструмент
curl -X GET http://localhost:5000/api/tools/TOOL_ID -b cookies.txt
```

### Создание с ценой и категорией
```bash
curl -X POST http://localhost:5000/api/tools \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Дрель Makita",
    "serialNumber": "SN-12345",
    "description": "Описание",
    "price": 15000.50,
    "categoryId": "CATEGORY_ID",
    "warehouseId": "WAREHOUSE_ID"
  }'
```

### Обновление
```bash
curl -X PUT http://localhost:5000/api/tools/TOOL_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Новое название",
    "price": 16000,
    "categoryId": "NEW_CATEGORY_ID"
  }'
```

---

## 📊 SQL запросы

### Статистика по категориям
```sql
-- Подключение к БД
docker exec -it toolmanager_postgres psql -U postgres -d toolmanager

-- Количество инструментов в категориях
SELECT 
  c.name as category,
  COUNT(t.id) as tools_count
FROM "Category" c
LEFT JOIN "Tool" t ON t."categoryId" = c.id
GROUP BY c.id, c.name
ORDER BY tools_count DESC;

-- Общая стоимость по категориям
SELECT 
  c.name as category,
  COUNT(t.id) as tools_count,
  SUM(t.price) as total_value
FROM "Category" c
LEFT JOIN "Tool" t ON t."categoryId" = c.id
GROUP BY c.id, c.name
ORDER BY total_value DESC NULLS LAST;

-- Самые дорогие инструменты
SELECT 
  t.name,
  t.price,
  c.name as category
FROM "Tool" t
LEFT JOIN "Category" c ON t."categoryId" = c.id
WHERE t.price IS NOT NULL
ORDER BY t.price DESC
LIMIT 10;
```

### Массовое обновление
```sql
-- Создать категории для компании
INSERT INTO "Category" (id, name, "companyId", "createdAt") 
VALUES 
  (gen_random_uuid(), 'Электроинструмент', 'YOUR_COMPANY_ID', NOW()),
  (gen_random_uuid(), 'Ручной инструмент', 'YOUR_COMPANY_ID', NOW()),
  (gen_random_uuid(), 'Измерительный', 'YOUR_COMPANY_ID', NOW());

-- Назначить категорию инструментам
UPDATE "Tool" 
SET "categoryId" = (
  SELECT id FROM "Category" 
  WHERE name = 'Электроинструмент' 
  LIMIT 1
)
WHERE name ILIKE '%дрель%' OR name ILIKE '%перфоратор%';
```

---

## 🔍 Отладка

### Проверка портов
```bash
# Проверить, занят ли порт
lsof -i :5000  # backend
lsof -i :5173  # frontend
lsof -i :5432  # PostgreSQL

# Убить процесс на порту
kill -9 $(lsof -t -i:5000)
```

### Проверка процессов
```bash
# Найти Node.js процессы
ps aux | grep node

# Найти Docker контейнеры
docker ps

# Логи Docker
docker logs toolmanager_postgres -f
```

### Проверка подключения к БД
```bash
# Подключиться к БД
docker exec -it toolmanager_postgres psql -U postgres -d toolmanager

# Список таблиц
\dt

# Структура таблицы
\d "Tool"
\d "Category"

# Выход
\q
```

---

## 🧹 Очистка

### Полная очистка (если нужен свежий старт)
```bash
# ВНИМАНИЕ: Удалит ВСЕ данные!

# 1. Остановить сервисы
killall node

# 2. Удалить БД и контейнеры
docker compose down -v

# 3. Очистить зависимости
cd backend
rm -rf node_modules package-lock.json
cd ../frontend
rm -rf node_modules pnpm-lock.yaml

# 4. Переустановить все
cd ../backend && npm install
cd ../frontend && pnpm install

# 5. Создать БД заново
docker compose up -d
cd backend
npx prisma migrate dev
npx prisma generate
```

---

## 📝 Git команды

### Коммит изменений
```bash
# Проверить статус
git status

# Добавить файлы
git add .

# Коммит
git commit -m "feat: add price and categories to tools"

# Пуш (если на ветке feat/tool-price-and-categories)
git push origin feat/tool-price-and-categories
```

### Откат изменений
```bash
# Отменить локальные изменения
git checkout .

# Вернуться к предыдущему коммиту
git checkout HEAD~1

# Откатить конкретный файл
git checkout HEAD~1 -- backend/prisma/schema.prisma
```

---

## 🎓 Полезные команды

### Получить ID компании
```bash
# Через API (нужна авторизация)
curl http://localhost:5000/api/auth/me -b cookies.txt | jq '.user.companyId'

# Через SQL
docker exec -it toolmanager_postgres psql -U postgres -d toolmanager \
  -c "SELECT id, name FROM \"Company\";"
```

### Получить ID категории по имени
```bash
curl http://localhost:5000/api/categories -b cookies.txt | \
  jq -r '.categories[] | select(.name=="Электроинструмент") | .id'
```

### Создать тестовые данные
```bash
# Скрипт для создания категорий и инструментов
cat > /tmp/seed.sh << 'EOF'
#!/bin/bash

# Создать категории
for cat in "Электроинструмент" "Ручной инструмент" "Измерительный"; do
  curl -X POST http://localhost:5000/api/categories \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "{\"name\": \"$cat\"}"
done

# Создать инструменты
CATEGORY_ID=$(curl -s http://localhost:5000/api/categories -b cookies.txt | \
  jq -r '.categories[0].id')

for i in {1..5}; do
  curl -X POST http://localhost:5000/api/tools \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "{
      \"name\": \"Инструмент $i\",
      \"serialNumber\": \"SN-000$i\",
      \"price\": $((10000 + RANDOM % 20000)),
      \"categoryId\": \"$CATEGORY_ID\"
    }"
done
EOF

chmod +x /tmp/seed.sh
/tmp/seed.sh
```

---

## 🔗 Быстрые ссылки

- **Backend API:** http://localhost:5000/api
- **Frontend:** http://localhost:5173
- **Prisma Studio:** `npx prisma studio` (http://localhost:5555)
- **Health Check:** http://localhost:5000/api/health

---

## 📚 Документация

- [QUICK_START.md](./QUICK_START.md) - Быстрый старт
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Полное руководство
- [API_CATEGORIES.md](./API_CATEGORIES.md) - API документация
- [FAQ.md](./FAQ.md) - Частые вопросы

---

**Сохраните этот файл в закладки для быстрого доступа! 📌**

**Версия:** 1.0 | **Дата:** 06.11.2024
