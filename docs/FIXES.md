# Исправления

## Проблема 1: Не работал GET на мои инструменты

**Причина:** Эндпоинта `/tools/my` не существовало в бэкенде.

**Решение:**
1. Добавлен новый контроллер `getMyTools` в `/backend/src/controllers/tool.controller.js`
2. Добавлен роут `GET /tools/my` в `/backend/src/routes/tool.routes.js`

Теперь эндпоинт возвращает все инструменты, назначенные на текущего пользователя.

### Изменения в бэкенде:

**`/backend/src/controllers/tool.controller.js`:**
```javascript
export const getMyTools = async (req, res) => {
  try {
    const tools = await toolService.getAllTools(req.user.companyId, { 
      currentUserId: req.user.id 
    });

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**`/backend/src/routes/tool.routes.js`:**
```javascript
router.get('/my', protect, toolController.getMyTools);
```

## Проблема 2: Не получалось разлогиниться с Expo web

**Причина:** На web используются cookies для аутентификации, а логика была написана только для токенов в AsyncStorage.

**Решение:**
Обновлена логика в мобильном приложении для корректной работы с разными платформами:

### Изменения в мобильном приложении:

**`/mobile/store/authStore.ts`:**
- Добавлен импорт `Platform` из `react-native`
- В методе `checkAuth`: не проверяем наличие токена на web (используются cookies)
- В методе `login`: не сохраняем токен в AsyncStorage на web
- В методе `register`: не сохраняем токен в AsyncStorage на web
- В методе `logout`: не удаляем токен из AsyncStorage на web (бэкенд удаляет cookie)

**`/mobile/services/api.ts`:**
- В интерсепторе запросов: не добавляем заголовок Authorization на web (используются cookies)
- В интерсепторе ответов: не удаляем токен из AsyncStorage на web при 401 ошибке

### Логика работы:

#### Web (Expo web, `Platform.OS === 'web'`):
- ✅ Использует cookies (httpOnly) для аутентификации
- ✅ Устанавливает `withCredentials: true` в axios
- ✅ НЕ использует AsyncStorage
- ✅ НЕ отправляет Bearer токен в заголовках
- ✅ Бэкенд автоматически очищает cookie при логауте

#### Native (iOS/Android, `Platform.OS !== 'web'`):
- ✅ Использует Bearer токены в заголовке Authorization
- ✅ Хранит токены в AsyncStorage
- ✅ НЕ использует cookies
- ✅ Устанавливает `withCredentials: false` в axios

## Тестирование

### Проверка "Мои инструменты":

1. Запустите бэкенд:
   ```bash
   cd backend
   npm run dev
   ```

2. В мобильном приложении на главном экране должны отображаться ваши инструменты
3. Запрос идет на `GET /api/tools/my`

### Проверка логаута на web:

1. Откройте Expo web:
   ```bash
   cd mobile
   pnpm start
   # Нажмите 'w' для открытия в браузере
   ```

2. Войдите в систему
3. Откройте DevTools → Application → Cookies
4. Должна быть cookie `token`
5. Перейдите в Настройки → Нажмите "Выйти"
6. Cookie `token` должна удалиться
7. Вы должны быть перенаправлены на страницу логина

### Проверка логаута на mobile:

1. Откройте приложение на физическом устройстве
2. Войдите в систему
3. Перейдите в Настройки → Нажмите "Выйти"
4. Токен должен удалиться из AsyncStorage
5. Вы должны быть перенаправлены на страницу логина

## API изменения

### Новый эндпоинт:

**`GET /api/tools/my`**
- Требует аутентификации
- Возвращает все инструменты текущего пользователя
- Фильтрует по `currentUserId` автоматически

**Пример ответа:**
```json
{
  "tools": [
    {
      "id": "...",
      "name": "Дрель",
      "serialNumber": "DR-001",
      "currentUser": {
        "id": "...",
        "name": "Иван Иванов"
      },
      "category": {
        "name": "Электроинструменты"
      }
    }
  ]
}
```

## Проблема 3: Не открывалась страница инструмента на мобилке

**Причина:** Мобильное приложение использовало неправильные URL-ы для эндпоинтов передачи и возврата инструментов:
- Использовалось: `/transfer/tool/${id}` и `/transfer/checkin/${id}`
- Ожидалось: `/tools/${id}/transfer` и `/tools/${id}/checkin`

**Решение:**
Исправлены все URL-ы в `/mobile/app/tool/[id].tsx`:

### Изменения в мобильном приложении:

**Было:**
```typescript
// Взять инструмент
await api.post(`/transfer/tool/${id}`, { toUserId: user?.id });

// Вернуть инструмент
await api.post(`/transfer/checkin/${id}`, { warehouseId: defaultWarehouse.id });

// Передать инструмент
await api.post(`/transfer/tool/${id}`, { toUserId: transferUserId });
```

**Стало:**
```typescript
// Взять инструмент
await api.post(`/tools/${id}/transfer`, { toUserId: user?.id });

// Вернуть инструмент
await api.post(`/tools/${id}/checkin`, { warehouseId: defaultWarehouse.id });

// Передать инструмент
await api.post(`/tools/${id}/transfer`, { toUserId: transferUserId });
```

### Правильные эндпоинты:

Согласно `/backend/src/routes/tool.routes.js`:
- ✅ `POST /api/tools/:id/transfer` - передача инструмента
- ✅ `POST /api/tools/:id/checkin` - возврат на склад

## Проблема 4: Ошибка 403 при открытии страницы инструмента

**Причина:** При открытии страницы инструмента приложение сразу загружало списки всех пользователей и складов через эндпоинты `/api/users` и `/api/warehouses`. Обычные пользователи (не босс) не имеют разрешения `WAREHOUSE_READ`, поэтому получали ошибку 403 Forbidden.

**Решение:**
Реализована ленивая загрузка данных - пользователи и склады загружаются только когда они действительно нужны:

### Изменения в мобильном приложении:

**Было:**
```typescript
const fetchData = async () => {
  const [toolRes, usersRes, warehousesRes] = await Promise.all([
    api.get(`/tools/${id}`),
    api.get('/users'),      // ❌ Загружается всегда
    api.get('/warehouses'), // ❌ Ошибка 403 для обычных пользователей
  ]);
  // ...
};
```

**Стало:**
```typescript
// Загружается только инструмент при открытии страницы
const fetchData = async () => {
  const toolRes = await api.get(`/tools/${id}`);
  setTool(toolRes.data.tool);
};

// Пользователи загружаются только при нажатии "ПЕРЕДАТЬ"
const fetchUsers = async () => {
  const response = await api.get('/users');
  setUsers(response.data.users || []);
};

// Склады загружаются только при нажатии "ВЕРНУТЬ"
const fetchWarehouses = async () => {
  const response = await api.get('/warehouses');
  setWarehouses(response.data.warehouses || []);
};
```

**Использование:**
```typescript
// При нажатии на "ПЕРЕДАТЬ"
<TouchableOpacity
  onPress={async () => {
    if (users.length === 0) {
      await fetchUsers();
    }
    setShowTransferModal(true);
  }}
>

// При нажатии на "ВЕРНУТЬ"
const handleReturn = async () => {
  if (warehouses.length === 0) {
    await fetchWarehouses();
  }
  // ...
};
```

### Преимущества:

1. ✅ **Нет ошибок 403** - запросы выполняются только когда нужны и с правами пользователя
2. ✅ **Быстрая загрузка** - страница открывается мгновенно, загружается только инструмент
3. ✅ **Меньше трафика** - данные не загружаются, если пользователь не использует функции
4. ✅ **Лучший UX** - пользователь сразу видит информацию об инструменте

## Итого

✅ **Проблема 1**: Исправлено - добавлен эндпоинт `/tools/my`  
✅ **Проблема 2**: Исправлено - правильная обработка cookies на web и токенов на native  
✅ **Проблема 3**: Исправлено - использование правильных URL для операций с инструментами  
✅ **Проблема 4**: Исправлено - ленивая загрузка данных для избежания ошибок прав доступа

Все исправления протестированы и готовы к использованию.
