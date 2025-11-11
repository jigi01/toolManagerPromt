# Настройка для работы с мобильным приложением

## Что было изменено

### Backend (`/backend/src/server.js`)

1. **Сервер слушает на всех интерфейсах** (`0.0.0.0`):
   ```javascript
   app.listen(PORT, '0.0.0.0', () => { ... });
   ```
   Теперь backend доступен не только на localhost, но и по IP-адресу вашего компьютера.

2. **CORS настроен для локальной сети**:
   ```javascript
   // Разрешены запросы с любых адресов 192.168.x.x
   if (origin && origin.startsWith('http://192.168.')) {
     callback(null, true);
   }
   ```

### Mobile (`/mobile/services/api.ts`)

1. **API URL изменен на IP-адрес**:
   ```typescript
   const API_URL = 'http://192.168.0.191:5001/api';
   ```

2. **Отключен withCredentials**:
   ```typescript
   withCredentials: false, // Мобильное приложение использует Bearer токены, не cookies
   ```
   Мобильное приложение использует Bearer токены в заголовках, а не cookies.

3. **Поддержка переменных окружения**:
   - Создан файл `/mobile/.env`
   - Обновлен `/mobile/app.json` с настройкой `extra.apiUrl`

## Как использовать

### 1. Узнайте свой IP-адрес

**Windows:**
```bash
ipconfig
```

**macOS/Linux:**
```bash
ifconfig
# или
ip addr show
```

Найдите IP-адрес в формате `192.168.x.x` (например, `192.168.0.191`).

### 2. Обновите конфигурацию (если IP изменился)

**Mobile:**
- Отредактируйте `/mobile/.env`:
  ```
  EXPO_PUBLIC_API_URL=http://ВАШ_IP:5001/api
  ```
- Или отредактируйте `/mobile/app.json`:
  ```json
  {
    "expo": {
      "extra": {
        "apiUrl": "http://ВАШ_IP:5001/api"
      }
    }
  }
  ```

**Backend:**
- Никаких изменений не требуется - CORS автоматически разрешает все адреса 192.168.x.x

### 3. Запустите backend

```bash
cd backend
npm run dev
```

Backend будет доступен на:
- `http://localhost:5001/api` (для веб-приложения)
- `http://192.168.0.191:5001/api` (для мобильного приложения)

### 4. Запустите мобильное приложение

```bash
cd mobile
pnpm install
pnpm start
```

### 5. Убедитесь, что устройства в одной сети

- Компьютер и телефон должны быть подключены к одной Wi-Fi сети
- Firewall не должен блокировать порт 5000

## Проверка работы

### Тест API

```bash
# С компьютера (localhost)
curl http://localhost:5001/api/health

# С телефона или другого устройства (по IP)
curl http://192.168.0.191:5001/api/health
```

Ответ должен быть:
```json
{"status":"OK","message":"ToolManager API is running"}
```

### Проверка CORS

В консоли браузера или в логах мобильного приложения не должно быть ошибок типа:
- "CORS policy"
- "Network request failed"
- "Not allowed by CORS"

## Troubleshooting

### Backend не доступен по IP

1. **Проверьте firewall:**
   - Windows: добавьте правило для порта 5001
   - macOS: System Preferences → Security & Privacy → Firewall
   - Linux: `sudo ufw allow 5001`

2. **Проверьте, что backend слушает на 0.0.0.0:**
   В логах должно быть: "Сервер запущен на порту 5001 и доступен на всех сетевых интерфейсах"

### Ошибки CORS

1. Проверьте origin в запросе
2. Убедитесь, что origin начинается с `http://192.168.`
3. Проверьте логи backend на наличие сообщений о CORS

### Мобильное приложение не подключается

1. Убедитесь, что телефон и компьютер в одной сети
2. Проверьте IP-адрес в `/mobile/.env` или `/mobile/app.json`
3. Перезапустите Expo dev server после изменения конфигурации
4. Проверьте, что backend запущен и доступен

## Текущая конфигурация

- **IP адрес**: `192.168.0.191`
- **Backend порт**: `5001`
- **API URL**: `http://192.168.0.191:5001/api`
- **Auth метод**: Bearer токены для mobile, cookies для web
- **CORS**: Разрешены все адреса 192.168.x.x
