# Исправление: Ошибка 403 при возврате инструмента на склад

## Проблема

При нажатии кнопки "ВЕРНУТЬ НА СКЛАД" в мобильном приложении возникала ошибка 403 Forbidden при попытке загрузить список складов через `/api/warehouses`.

### Ошибка:
```
GET http://localhost:5001/api/warehouses 403 (Forbidden)
Error fetching warehouses: AxiosError {
  message: 'Request failed with status code 403',
  code: 'ERR_BAD_REQUEST'
}
```

### Причина:

1. **Бэкенд**: Эндпоинт `/api/warehouses` требует разрешение `WAREHOUSE_READ`, которого нет у обычных пользователей (не босс)
2. **Фронтенд**: Мобильное приложение пыталось загрузить список всех складов для выбора при возврате

## Решение

Использовать автоматический выбор склада по умолчанию на бэкенде вместо загрузки списка складов на фронтенде.

### Изменения в бэкенде

#### Файл: `/backend/src/controllers/tool.controller.js`

**Было:**
```javascript
export const checkinTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;

    const tool = await toolService.checkinTool(
      id,
      req.user.id,
      req.user.companyId,
      warehouseId  // ❌ Требовался warehouseId
    );

    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

**Стало:**
```javascript
export const checkinTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;

    const tool = await toolService.checkinTool(
      id,
      req.user.id,
      req.user.companyId,
      warehouseId || null  // ✅ warehouseId опциональный
    );

    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

**Примечание:** Сервисный слой уже поддерживал автоматический выбор склада по умолчанию (строки 364-374 в `tool.service.js`):

```javascript
// Если склад не указан, используем дефолтный
let targetWarehouseId = warehouseId;
if (!targetWarehouseId) {
  const defaultWarehouse = await tx.warehouse.findFirst({
    where: { companyId, isDefault: true }
  });
  
  if (defaultWarehouse) {
    targetWarehouseId = defaultWarehouse.id;
  }
}
```

### Изменения в мобильном приложении

#### Файл: `/mobile/app/tool/[id].tsx`

**Было:**
```typescript
const handleReturn = async () => {
  let availableWarehouses = warehouses;
  
  // ❌ Пытаемся загрузить склады (требует WAREHOUSE_READ)
  if (availableWarehouses.length === 0) {
    availableWarehouses = await fetchWarehouses();
  }

  if (availableWarehouses.length === 0) {
    Alert.alert('Ошибка', 'Нет доступных складов');
    return;
  }

  const defaultWarehouse = availableWarehouses[0];
  
  Alert.alert(
    'Вернуть на склад',
    `Вернуть инструмент на склад "${defaultWarehouse.name}"?`,
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Вернуть',
        onPress: async () => {
          setProcessing(true);
          try {
            await api.post(`/tools/${id}/checkin`, {
              warehouseId: defaultWarehouse.id,  // ❌ Передаем ID склада
            });
            // ...
          }
        },
      },
    ]
  );
};
```

**Стало:**
```typescript
const handleReturn = async () => {
  // ✅ Не загружаем склады, полагаемся на бэкенд
  Alert.alert(
    'Вернуть на склад',
    'Вернуть инструмент на склад по умолчанию?',
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Вернуть',
        onPress: async () => {
          setProcessing(true);
          try {
            await api.post(`/tools/${id}/checkin`, {});  // ✅ Пустое тело, бэкенд выберет склад
            Alert.alert('Успех', 'Инструмент возвращен на склад');
            fetchData();
          } catch (error: any) {
            Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось вернуть инструмент');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]
  );
};
```

**Удалены:**
- Функция `fetchWarehouses()` - больше не нужна
- State `warehouses` - больше не используется
- Import `Warehouse` из types - больше не нужен

## Преимущества решения

✅ **Нет проблем с правами доступа** - не требуется `WAREHOUSE_READ` для обычных пользователей  
✅ **Упрощенный UX** - пользователь не выбирает склад вручную, все автоматически  
✅ **Меньше кода** - удалена ненужная логика загрузки складов  
✅ **Быстрее** - нет дополнительного API запроса  
✅ **Надежнее** - логика выбора склада централизована на бэкенде  

## Логика работы

1. Пользователь нажимает "ВЕРНУТЬ НА СКЛАД"
2. Показывается подтверждающий диалог
3. Отправляется запрос `POST /api/tools/:id/checkin` с пустым телом `{}`
4. Бэкенд автоматически выбирает склад по умолчанию (с `isDefault: true`)
5. Инструмент возвращается на этот склад
6. Пользователь видит сообщение об успехе

## Тестирование

### Проверка возврата на склад:

1. Откройте мобильное приложение (Expo web или на устройстве)
2. Перейдите на страницу инструмента, который у вас
3. Нажмите кнопку **"ВЕРНУТЬ"**
4. Подтвердите действие в диалоге
5. Инструмент должен успешно вернуться на склад по умолчанию

### Ожидаемое поведение:

- ✅ Нет ошибки 403 Forbidden
- ✅ Диалог показывается без задержек
- ✅ Инструмент возвращается на склад по умолчанию
- ✅ Появляется сообщение "Инструмент возвращен на склад"
- ✅ Статус инструмента обновляется

### Что проверить на бэкенде:

Убедитесь, что в вашей компании есть склад по умолчанию:

```sql
SELECT * FROM "Warehouse" WHERE "isDefault" = true;
```

Если склада по умолчанию нет, создайте его или установите флаг `isDefault` для существующего склада.

## API контракт

### `POST /api/tools/:id/checkin`

**Request body** (все поля опциональны):
```json
{
  "warehouseId": "optional-warehouse-id"
}
```

или просто:
```json
{}
```

**Поведение:**
- Если `warehouseId` указан - инструмент вернется на этот склад
- Если `warehouseId` НЕ указан - инструмент вернется на склад по умолчанию (`isDefault: true`)
- Если склада по умолчанию нет - инструмент будет возвращен без привязки к складу

**Response:**
```json
{
  "tool": {
    "id": "...",
    "name": "...",
    "currentUserId": null,
    "warehouseId": "...",
    "status": "AVAILABLE",
    ...
  }
}
```
