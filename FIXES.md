# Исправления

## Проблема 1: GET на мои инструменты не работал

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

## Итого

✅ Проблема 1: Исправлено - добавлен эндпоинт `/tools/my`  
✅ Проблема 2: Исправлено - правильная обработка cookies на web и токенов на native

Оба исправления протестированы и готовы к использованию.
