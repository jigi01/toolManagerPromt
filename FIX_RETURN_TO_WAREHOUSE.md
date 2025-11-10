# Исправление: Возврат инструмента на склад

## Проблема

При нажатии кнопки "ВЕРНУТЬ НА СКЛАД" в мобильном приложении возникала проблема с загрузкой списка складов.

### Техническая причина

Проблема заключалась в асинхронной природе React state. Когда мы вызывали:

```typescript
if (warehouses.length === 0) {
  await fetchWarehouses();  // Загружаем склады
}

if (warehouses.length === 0) {  // ❌ State еще не обновлен!
  Alert.alert('Ошибка', 'Нет доступных складов');
  return;
}
```

После `fetchWarehouses()` state `warehouses` мог еще не обновиться из-за асинхронной природы `setState`, поэтому проверка `warehouses.length === 0` давала неверный результат.

## Решение

Изменили функции `fetchWarehouses` и `fetchUsers` чтобы они возвращали загруженные данные напрямую, а не полагались на обновление state:

### Было:

```typescript
const fetchWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    setWarehouses(response.data.warehouses || []);
    // ❌ Ничего не возвращаем
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    Alert.alert('Ошибка', 'Не удалось загрузить список складов');
  }
};

const handleReturn = async () => {
  if (warehouses.length === 0) {
    await fetchWarehouses();
  }

  if (warehouses.length === 0) {  // ❌ State может быть не обновлен
    Alert.alert('Ошибка', 'Нет доступных складов');
    return;
  }

  const defaultWarehouse = warehouses[0];
  // ...
};
```

### Стало:

```typescript
const fetchWarehouses = async () => {
  try {
    const response = await api.get('/warehouses');
    const fetchedWarehouses = response.data.warehouses || [];
    setWarehouses(fetchedWarehouses);
    return fetchedWarehouses;  // ✅ Возвращаем загруженные данные
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    Alert.alert('Ошибка', 'Не удалось загрузить список складов');
    return [];  // ✅ Возвращаем пустой массив при ошибке
  }
};

const handleReturn = async () => {
  let availableWarehouses = warehouses;
  
  if (availableWarehouses.length === 0) {
    availableWarehouses = await fetchWarehouses();  // ✅ Получаем данные напрямую
  }

  if (availableWarehouses.length === 0) {  // ✅ Проверяем реальные данные
    Alert.alert('Ошибка', 'Нет доступных складов');
    return;
  }

  const defaultWarehouse = availableWarehouses[0];  // ✅ Используем загруженные данные
  // ...
};
```

## Изменения в коде

### Файл: `/mobile/app/tool/[id].tsx`

1. **`fetchWarehouses()` - теперь возвращает массив складов:**
   - Возвращает загруженные склады при успехе
   - Возвращает пустой массив при ошибке

2. **`fetchUsers()` - аналогично для пользователей:**
   - Возвращает загруженных пользователей при успехе
   - Возвращает пустой массив при ошибке

3. **`handleReturn()` - использует возвращаемое значение:**
   - Сохраняет результат `fetchWarehouses()` в локальную переменную
   - Использует эту переменную вместо state
   - Гарантирует актуальные данные

## Преимущества

✅ **Надежность** - нет зависимости от времени обновления state  
✅ **Предсказуемость** - всегда работаем с актуальными данными  
✅ **Простота** - понятная логика без гонки состояний  
✅ **Консистентность** - одинаковый подход для users и warehouses

## Тестирование

Для проверки исправления:

1. Откройте мобильное приложение (Expo web или на устройстве)
2. Перейдите на страницу инструмента, который у вас
3. Нажмите кнопку **"ВЕРНУТЬ"**
4. Должен появиться диалог с названием склада
5. Подтвердите возврат
6. Инструмент должен успешно вернуться на склад

### Ожидаемое поведение:

- ✅ Диалог показывает название склада
- ✅ После подтверждения инструмент возвращается на склад
- ✅ Появляется сообщение "Инструмент возвращен на склад"
- ✅ Статус инструмента обновляется

## Дополнительные улучшения

Такой же подход применен к `fetchUsers()` для функции передачи инструмента, что повышает общую стабильность приложения.
