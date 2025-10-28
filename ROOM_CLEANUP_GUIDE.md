# 🧹 Руководство по очистке комнат

## ✅ Что уже сделано:

1. ✅ Добавлено поле `LastActivity` в модель Room
2. ✅ Добавлены функции очистки в websocket.go

## 📝 Что нужно сделать вручную:

### 1. Обновить создание комнаты (строка 288-296 в websocket.go)

**Было:**
```go
room := &models.Room{
    ID:            fmt.Sprintf("room_%d", time.Now().Unix()),
    Code:          roomCode,
    Phase:         models.PhaseLobby,
    Players:       make(map[string]*models.Player),
    Teams:         make(map[string]*models.Team),
    CreatedAt:     time.Now(),
    AdminPassword: adminPassword,
}
```

**Должно быть:**
```go
room := &models.Room{
    ID:            fmt.Sprintf("room_%d", time.Now().Unix()),
    Code:          roomCode,
    Phase:         models.PhaseLobby,
    Players:       make(map[string]*models.Player),
    Teams:         make(map[string]*models.Team),
    CreatedAt:     time.Now(),
    LastActivity:  time.Now(),  // <- ДОБАВЬТЕ ЭТУ СТРОКУ
    AdminPassword: adminPassword,
}
```

### 2. Добавить обновление активности в HandleEvent (после строки 118)

**Добавьте после строки 118:**
```go
// Update room activity timestamp
if room != nil {
    ws.updateRoomActivity(room)
}
```

### 3. Запустить очистку комнат в main.go

**В файле `backend/cmd/server/main.go` добавьте после создания wsService:**

```go
// Start room cleanup service
wsService.StartRoomCleanup()
log.Println("Room cleanup service started")
```

## 🔄 Ответы на ваши вопросы:

### ❓ Как удалить уже запущенные комнаты?

**Вариант 1: Перезапуск сервера**
```bash
docker-compose down
docker-compose up -d --build
```
✅ Все комнаты удалятся, так как они хранятся только в памяти (RAM)

**Вариант 2: Перезапуск только backend**
```bash
docker-compose restart backend
```
✅ Только backend перезапустится, комнаты удалятся

**Вариант 3: Ручное удаление через API**
Я могу добавить endpoint `/api/admin/rooms/cleanup` для ручного удаления

### ❓ Сотрутся ли комнаты при пересборке?

**ДА! 💯** Комнаты сотрутся при:
- Перезапуске контейнера
- Пересборке проекта
- Перезагрузке сервера
- Падении приложения

**Почему?** Комнаты хранятся в **оперативной памяти (RAM)**, не в базе данных!

```go
// Hub manages all rooms and clients
type Hub struct {
    Rooms      map[string]*Room  // <- Это в RAM!
    Clients    map[*Client]bool
    // ...
}
```

## 🎯 Как работает автоочистка:

1. **Каждые 30 минут** запускается проверка
2. **Проверяются все комнаты** на последнюю активность
3. **Удаляются комнаты**, где нет активности больше **1 часа**
4. **Логируется** количество удаленных комнат

## 📊 Логи, которые вы увидите:

```
Room cleanup service started (runs every 30 minutes)
Updated activity for room ABCD
Running room cleanup...
Room ABCD marked for deletion (last activity: 2025-10-28 01:00:00)
Deleted inactive room: ABCD
Cleaned up 1 inactive rooms
```

## 🚀 Быстрый старт:

1. Внесите изменения из пунктов 1-3
2. Пересоберите проект:
   ```bash
   cd backend
   docker-compose down
   docker-compose up -d --build
   ```
3. Проверьте логи:
   ```bash
   docker-compose logs -f backend
   ```

## 💡 Дополнительно:

Хотите добавить **ручное удаление комнат**? Скажите, и я добавлю админ-endpoint!

