# 📁 Структура Проекта ToolManager

## 🎯 Обзор

Полнофункциональное Full-Stack приложение для управления инструментами компании.

---

## 📂 Структура Файлов

```
toolmanager/
│
├── 📄 README.md                       # Главная инструкция по запуску
├── 📄 .gitignore                      # Игнорируемые файлы Git
├── 📄 PROJECT_STRUCTURE.md            # Этот файл
│
├── 📁 backend/                        # Бэкенд (Node.js + Express + Prisma)
│   ├── 📄 package.json                # Зависимости бэкенда
│   ├── 📄 .env.example                # Пример переменных окружения
│   │
│   ├── 📁 prisma/
│   │   └── 📄 schema.prisma           # Схема базы данных
│   │
│   └── 📁 src/
│       ├── 📄 server.js               # Точка входа приложения
│       │
│       ├── 📁 controllers/            # Обработчики HTTP запросов
│       │   ├── auth.controller.js
│       │   ├── user.controller.js
│       │   ├── tool.controller.js
│       │   └── transfer.controller.js
│       │
│       ├── 📁 services/               # Бизнес-логика
│       │   ├── auth.service.js        # ⭐ Регистрация/вход (первый = ADMIN)
│       │   ├── user.service.js
│       │   ├── tool.service.js
│       │   └── transfer.service.js
│       │
│       ├── 📁 routes/                 # Определение API эндпоинтов
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── tool.routes.js
│       │   └── transfer.routes.js
│       │
│       ├── 📁 middleware/             # Middleware слой
│       │   └── auth.middleware.js     # protect, adminOnly
│       │
│       └── 📁 utils/
│           └── prisma.js              # Singleton Prisma Client
│
└── 📁 frontend/                       # Фронтенд (React + Vite + Chakra UI)
    ├── 📄 package.json                # Зависимости фронтенда
    ├── 📄 .env.example                # Пример переменных окружения
    ├── 📄 index.html                  # HTML точка входа
    ├── 📄 vite.config.js              # Конфигурация Vite
    │
    └── 📁 src/
        ├── 📄 main.jsx                # Точка входа React
        ├── 📄 App.jsx                 # Корневой компонент
        │
        ├── 📁 pages/                  # Страницы приложения
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardAdmin.jsx     # ⭐ Панель администратора
        │   ├── DashboardEmployee.jsx  # ⭐ Панель сотрудника
        │   ├── ToolsPage.jsx          # Список всех инструментов (ADMIN)
        │   ├── ToolDetailsPage.jsx    # Детали + история инструмента
        │   └── UsersPage.jsx          # Управление пользователями (ADMIN)
        │
        ├── 📁 components/             # Переиспользуемые компоненты
        │   ├── Layout.jsx             # Общий макет с навигацией
        │   ├── ProtectedRoute.jsx     # Защита роутов (авторизация)
        │   ├── AdminRoute.jsx         # Защита роутов (только ADMIN)
        │   └── TransferToolModal.jsx  # ⭐ Модалка для передачи
        │
        ├── 📁 router/
        │   └── AppRouter.jsx          # Конфигурация React Router
        │
        ├── 📁 services/
        │   └── api.js                 # Axios instance с credentials
        │
        └── 📁 store/
            └── authStore.js           # ⭐ Zustand store (аутентификация)
```

---

## 🗄️ База Данных (PostgreSQL)

### Модели (Prisma Schema):

#### 1️⃣ **User** (Пользователи)
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   # Хэшированный (bcrypt)
  name      String
  role      Role     @default(EMPLOYEE)  # ADMIN или EMPLOYEE
  createdAt DateTime @default(now())
  
  toolsOwned   Tool[]          # Инструменты у пользователя
  historyFrom  ToolHistory[]   # Записи "от кого"
  historyTo    ToolHistory[]   # Записи "кому"
}
```

#### 2️⃣ **Tool** (Инструменты)
```prisma
model Tool {
  id             Int        @id @default(autoincrement())
  name           String
  serialNumber   String     @unique
  description    String?
  status         ToolStatus @default(AVAILABLE)  # AVAILABLE, IN_USE, MAINTENANCE
  createdAt      DateTime   @default(now())
  
  currentOwnerId Int?
  currentOwner   User?
  history        ToolHistory[]
}
```

#### 3️⃣ **ToolHistory** (История перемещений)
```prisma
model ToolHistory {
  id         Int      @id @default(autoincrement())
  timestamp  DateTime @default(now())
  toolId     Int
  fromUserId Int?     # null = со склада
  toUserId   Int?     # null = на склад
  notes      String?
  
  tool     Tool  @relation(...)
  fromUser User? @relation("FromUser", ...)
  toUser   User? @relation("ToUser", ...)
}
```

---

## 🌐 API Эндпоинты

### 🔐 Аутентификация (`/api/auth`)
| Метод | Эндпоинт            | Описание                        | Доступ  |
|-------|---------------------|---------------------------------|---------|
| POST  | `/register`         | Регистрация (1-й = ADMIN)       | Public  |
| POST  | `/login`            | Вход (установка JWT cookie)     | Public  |
| POST  | `/logout`           | Выход (очистка cookie)          | Public  |
| GET   | `/me`               | Данные текущего пользователя    | Auth    |

### 👥 Пользователи (`/api/users`)
| Метод | Эндпоинт            | Описание                        | Доступ  |
|-------|---------------------|---------------------------------|---------|
| GET   | `/`                 | Список всех пользователей       | ADMIN   |
| PUT   | `/role/:id`         | Изменить роль пользователя      | ADMIN   |

### 🔧 Инструменты (`/api/tools`)
| Метод  | Эндпоинт            | Описание                        | Доступ  |
|--------|---------------------|---------------------------------|---------|
| POST   | `/`                 | Создать инструмент              | ADMIN   |
| GET    | `/`                 | Список инструментов (с фильтрами)| Auth   |
| GET    | `/:id`              | Детали + история инструмента    | Auth    |
| PUT    | `/:id`              | Обновить инструмент             | ADMIN   |
| DELETE | `/:id`              | Удалить инструмент              | ADMIN   |

### 🔄 Передача (`/api/transfer`)
| Метод | Эндпоинт            | Описание                        | Доступ  |
|-------|---------------------|---------------------------------|---------|
| POST  | `/assign`           | Выдать со склада сотруднику     | ADMIN   |
| POST  | `/return`           | Вернуть инструмент на склад     | Auth    |
| POST  | `/user-to-user`     | Передать другому сотруднику     | Auth    |

---

## 🎨 Страницы Фронтенда

### 🔓 Публичные страницы:
- `/login` — Страница входа
- `/register` — Регистрация нового пользователя

### 🔒 Защищенные страницы:
- `/` — Главная (Дашборд):
  - **ADMIN:** Статистика + общая информация
  - **EMPLOYEE:** "Мои инструменты"
- `/tools/:id` — Детали инструмента + история

### 👑 Только для ADMIN:
- `/tools` — Управление всеми инструментами (CRUD)
- `/users` — Управление пользователями (изменение ролей)

---

## 🔑 Ключевые Фичи

### 1️⃣ **Умная Регистрация**
- ✅ Первый зарегистрированный пользователь → **ADMIN**
- ✅ Все последующие → **EMPLOYEE**
- 📍 Реализовано в: `backend/src/services/auth.service.js`

### 2️⃣ **История Перемещений**
- ✅ Каждая операция (выдача/возврат/передача) создает запись в `ToolHistory`
- ✅ Отображается на странице деталей инструмента
- 📍 Реализовано в: `backend/src/services/transfer.service.js`

### 3️⃣ **Безопасная Аутентификация**
- ✅ JWT токены в **httpOnly cookies** (защита от XSS)
- ✅ Пароли хешируются с **bcrypt**
- ✅ CORS с `credentials: true`
- 📍 Реализовано в: `backend/src/middleware/auth.middleware.js`

### 4️⃣ **Роутинг с Защитой**
- ✅ **ProtectedRoute** — доступ только авторизованным
- ✅ **AdminRoute** — доступ только администраторам
- 📍 Реализовано в: `frontend/src/components/`

### 5️⃣ **Управление Состоянием**
- ✅ **Zustand** для глобального состояния аутентификации
- ✅ Автоматическая проверка авторизации при загрузке
- 📍 Реализовано в: `frontend/src/store/authStore.js`

---

## 🚀 Быстрый Старт

### 1. Установка зависимостей:
```bash
# Backend
cd backend && npm install

# Frontend (в новом терминале)
cd frontend && npm install
```

### 2. Настройка .env:
```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте DATABASE_URL и JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. База данных:
```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Запуск:
```bash
# Backend
cd backend && npm run dev

# Frontend (новый терминал)
cd frontend && npm run dev
```

### 5. Регистрация первого пользователя (ADMIN):
- Откройте `http://localhost:5173/register`
- Зарегистрируйтесь — вы автоматически станете администратором!

---

## 📊 Сценарии Использования

### Администратор может:
1. ✅ Добавлять новые инструменты
2. ✅ Выдавать инструменты сотрудникам
3. ✅ Управлять ролями пользователей
4. ✅ Просматривать всю статистику
5. ✅ Удалять инструменты

### Сотрудник может:
1. ✅ Видеть свои инструменты
2. ✅ Передавать инструменты коллегам
3. ✅ Возвращать инструменты на склад
4. ✅ Просматривать историю инструментов

---

## 🔧 Технологии

### Backend:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Validation:** express-validator

### Frontend:
- **Framework:** React 18
- **Build Tool:** Vite
- **UI Library:** Chakra UI
- **Routing:** React Router v6
- **State:** Zustand
- **HTTP:** Axios

---

## 📝 Дополнительные Команды

```bash
# Prisma Studio (GUI для БД)
cd backend && npx prisma studio

# Генерация Prisma Client
cd backend && npx prisma generate

# Сброс БД (осторожно!)
cd backend && npx prisma migrate reset

# Билд продакшн версии
cd frontend && npm run build
```

---

## ✅ Готово!

Весь код готов к запуску. Следуйте инструкциям в `README.md` для локального развертывания.

**Приятной работы с ToolManager! 🎉**
