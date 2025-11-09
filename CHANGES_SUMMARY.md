# Резюме изменений: Настройка мобильного приложения для работы по IP

## Проблема
Мобильное приложение не могло подключиться к backend API, так как использовало `localhost`, который не работает на физических устройствах.

## Решение
Настроены axios и CORS для работы с IP-адресом `192.168.0.191`.

## Изменения

### Backend

#### `/backend/src/server.js`
1. **Добавлен IP в список разрешенных origins:**
   ```javascript
   'http://192.168.0.191:8081', // Expo mobile на устройстве
   ```

2. **CORS настроен для разрешения всех запросов из локальной сети:**
   ```javascript
   if (origin && origin.startsWith('http://192.168.')) {
     callback(null, true);
   }
   ```

3. **Сервер слушает на всех интерфейсах:**
   ```javascript
   app.listen(PORT, '0.0.0.0', () => { ... });
   ```
   Теперь backend доступен не только на localhost, но и по IP.

### Mobile

#### `/mobile/services/api.ts`
1. **Изменен API_URL:**
   - Было: `http://localhost:5001/api`
   - Стало: `http://192.168.0.191:5001/api`

2. **Добавлена поддержка переменных окружения:**
   ```typescript
   const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                   process.env.EXPO_PUBLIC_API_URL || 
                   'http://192.168.0.191:5001/api';
   ```

3. **Отключен withCredentials:**
   ```typescript
   withCredentials: false, // Мобильное приложение использует Bearer токены
   ```

#### `/mobile/app.json`
Добавлена секция `extra` с настройкой API URL:
```json
"extra": {
  "apiUrl": "http://192.168.0.191:5001/api"
}
```

#### `/mobile/.env` (новый файл)
```
EXPO_PUBLIC_API_URL=http://192.168.0.191:5001/api
```

#### `/mobile/.env.example` (новый файл)
Шаблон для других разработчиков.

### Документация

#### `/MOBILE_SETUP.md` (новый файл)
Подробная документация по настройке для работы с мобильными устройствами.

#### `/mobile/README.md`
Инструкции по настройке мобильного приложения для физических устройств.

## Как использовать

### 1. Запустите backend:
```bash
cd backend
npm run dev
```

### 2. Запустите мобильное приложение:
```bash
cd mobile
pnpm start
```

### 3. Убедитесь:
- ✅ Телефон и компьютер в одной Wi-Fi сети
- ✅ Backend доступен по `http://192.168.0.191:5001`
- ✅ Firewall не блокирует порт 5001

## Если IP изменился

Обновите в файлах:
- `/mobile/.env` → `EXPO_PUBLIC_API_URL`
- `/mobile/app.json` → `expo.extra.apiUrl`

Backend автоматически разрешит любые адреса из диапазона `192.168.x.x`.

## Тестирование

```bash
# Проверка backend
curl http://192.168.0.191:5001/api/health

# Ожидаемый ответ:
# {"status":"OK","message":"ToolManager API is running"}
```

## Технические детали

- **Порт backend**: 5001
- **IP адрес**: 192.168.0.191
- **Auth метод**: Bearer токены (для mobile), cookies (для web)
- **CORS**: Разрешены все адреса 192.168.x.x
- **Server binding**: 0.0.0.0 (все интерфейсы)
