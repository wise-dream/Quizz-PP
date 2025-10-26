# PowerPoint Quiz - Быстрый старт

## Для пользователей: Автоматическое развертывание

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd "PowerPoint Quizz"

# Запустите автоматический скрипт развертывания
./deploy.sh
```

Скрипт предложит выбрать режим развертывания. Система будет доступна на `http://your-server-ip`

## Для разработчиков: Ручной запуск

### Запуск бэкенда
```bash
cd backend
go run ./cmd/server
```

Сервер будет доступен на `https://localhost:443`

## Установка аддинов в PowerPoint

### 1. Content Add-in (Live-таблица на слайде)
1. В PowerPoint: Insert → My Add-ins → Upload My Add-in
2. Выберите файл: `addin/content-addin/manifest.xml`
3. Аддин появится в списке доступных

### 2. Task Pane Add-in (Панель ведущего)
1. В PowerPoint: Insert → My Add-ins → Upload My Add-in  
2. Выберите файл: `addin/taskpane-addin/manifest.xml`
3. Аддин появится в списке доступных

## Использование

### Настройка ведущего
1. Откройте Task Pane Add-in
2. Введите название комнаты (например, "R1")
3. Нажмите "Connect"
4. Используйте кнопки для управления квизом

### Отображение результатов
1. Вставьте Content Add-in на слайд
2. Аддин автоматически подключится к той же комнате
3. Live-таблица будет обновляться в реальном времени

## WebSocket API

**Подключение:** `wss://localhost:443/ws?room=ROOM_NAME&role=host|viewer`

**Сообщения:**
- `{"type": "host_set_state", "quizId": "R1", "phase": "ready", "delayMs": 3000}`
- `{"type": "click", "userId": "player1", "buttonId": "btn1"}`
- `{"type": "state", "data": {...}}` - состояние комнаты

## Фазы квиза

- `lobby` - Ожидание игроков
- `ready` - Подготовка к старту
- `started` - Квиз активен
- `finished` - Квиз завершен

## Примечания

- Система использует HTTPS/WSS по умолчанию
- Генерация SSL сертификатов: `./generate-certs.sh`
- Для работы в браузере может потребоваться принять самоподписанный сертификат
- Подробная документация: см. [DEPLOYMENT.md](DEPLOYMENT.md) и [README.md](README.md)
