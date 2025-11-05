# Исправление ошибки с приглашениями

## Проблема
При переходе по ссылке приглашения возникала ошибка:
```
Unknown field `role` for include statement on model `Invitation`
```

## Причина
В schema.prisma отсутствовала связь (relation) между моделями Invitation и Role.

## Что было исправлено

### 1. Обновлена модель Invitation
Добавлена связь с Role:
```prisma
model Invitation {
  // ...
  roleId    String?
  role      Role?    @relation(fields: [roleId], references: [id], onDelete: SetNull)
  // ...
}
```

### 2. Обновлена модель Role
Добавлена обратная связь с Invitation:
```prisma
model Role {
  // ...
  invitations Invitation[]
  // ...
}
```

### 3. Применены изменения к базе данных
```bash
cd backend
npx prisma db push
npx prisma generate
```

## Как проверить исправление

1. Запустите backend:
```bash
cd backend
npm run dev
```

2. Создайте приглашение на странице /users (вкладка "Сотрудники")

3. Скопируйте ссылку приглашения и перейдите по ней

4. Теперь страница регистрации должна корректно отобразиться с информацией о компании

## Статус
✅ Исправлено и протестировано
