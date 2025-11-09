# ToolManager Mobile

React Native приложение для управления инструментами.

## Настройка для работы с физическим устройством

### 1. Узнайте IP-адрес вашего компьютера

**Windows:**
```bash
ipconfig
```
Найдите "IPv4 Address" вашего сетевого адаптера.

**macOS/Linux:**
```bash
ifconfig
# или
ip addr show
```
Найдите IP-адрес в формате 192.168.x.x

### 2. Обновите конфигурацию

Отредактируйте файл `.env` в корне папки mobile:
```
EXPO_PUBLIC_API_URL=http://ВАШ_IP:5001/api
```

Или обновите `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://ВАШ_IP:5001/api"
    }
  }
}
```

### 3. Убедитесь, что backend запущен

Backend должен слушать на всех интерфейсах (0.0.0.0), а не только на localhost.

```bash
cd backend
npm run dev
```

Backend должен быть доступен по адресу `http://ВАШ_IP:5001`

### 4. Проверьте firewall

Убедитесь, что порт 5001 открыт в firewall вашего компьютера.

### 5. Запустите приложение

```bash
pnpm install
pnpm start
```

Сканируйте QR-код в Expo Go или запустите на эмуляторе:
```bash
pnpm android
# или
pnpm ios
```

## Текущая конфигурация

- **API URL**: `http://192.168.0.128:5001/api`
- **Backend Port**: 5001
- **Auth**: Bearer токены (хранятся в AsyncStorage)

## Troubleshooting

### Ошибка "Network request failed"
- Проверьте, что backend запущен
- Проверьте IP-адрес в конфигурации
- Убедитесь, что телефон и компьютер в одной сети Wi-Fi
- Проверьте firewall

### Ошибка CORS
- Backend должен разрешать запросы с вашего IP
- Проверьте настройки CORS в `backend/src/server.js`

### Ошибка 401 (Unauthorized)
- Попробуйте выйти и войти заново
- Токен может быть устаревшим
