# PowerPoint Quiz Controller + Realtime Dashboard

Система проведения интерактивных квизов с физическими или виртуальными кнопками, управляемая из PowerPoint-презентации с отображением данных в реальном времени.

## 🎯 Описание

PowerPoint Quiz Controller - это комплексное решение для проведения интерактивных квизов, где:
- **PowerPoint** служит визуальным центром презентации
- **HTTPS WebSocket-сервер** управляет игроками и событиями
- **Надстройки PowerPoint** обеспечивают подключение игроков и отображение результатов
- **Веб-клиент** позволяет тестировать систему без PowerPoint

## 🚀 Быстрый старт

### Автоматическое развертывание (рекомендуется)

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd "PowerPoint Quiz"

# Запустите автоматический скрипт развертывания
./deploy.sh
```

Скрипт предложит выбрать режим:
- **Простое развертывание** - бэкенд + фронтенд (порты 80, 443)
- **Полное развертывание** - с nginx reverse proxy (порт 8443)
- **Только бэкенд** - для разработки

### Ручное развертывание

#### Вариант A: Простое развертывание
```bash
# 1. Генерация SSL сертификатов
./generate-certs.sh

# 2. Запуск сервисов
docker-compose up -d backend frontend
```

#### Вариант B: Полное развертывание с nginx
```bash
# 1. Генерация SSL сертификатов
./generate-certs.sh
./generate-nginx-certs.sh

# 2. Запуск всех сервисов
docker-compose --profile production up -d
```

## 📚 Документация

### 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Подробное руководство по развертыванию
**Этот файл содержит полную информацию о развертывании проекта.**

Ключевые темы:
- Подготовка сервера
- Настройка Docker и Docker Compose
- Варианты развертывания (простое и полное с nginx)
- Генерация SSL сертификатов
- Настройка HTTPS без домена (самоподписанные сертификаты)
- Работа с доменом (Let's Encrypt)
- Мониторинг и управление
- Решение проблем

### 📖 [USAGE.md](USAGE.md) - Руководство по использованию
Руководство пользователя с описанием:
- Быстрый старт
- Сценарии использования (класс, корпоративное мероприятие, конференция)
- Управление командами
- Фазы игры
- Мониторинг и безопасность

### ⚡ [QUICKSTART.md](QUICKSTART.md) - Быстрый старт для разработчиков
Краткое руководство для быстрого начала работы:
- Запуск сервера
- Установка аддинов в PowerPoint
- Использование WebSocket API
- Фазы квиза

### 🎨 [frontend/README.md](frontend/README.md) - Документация фронтенда
Подробная документация React фронтенда:
- Возможности для организаторов и участников
- Технологии и структура проекта
- Конфигурация и API
- Разработка и развертывание

### 🔌 [addin/README.md](addin/README.md) - Документация PowerPoint аддинов
Документация Office Add-ins для PowerPoint:
- Структура аддинов
- Установка и использование
- WebSocket протокол
- Безопасность

## 🏗️ Архитектура

### Backend (Go WebSocket Server)
- **Единый HTTPS сервер**: `cmd/server/main.go` (порт 443) - для продакшена
- **Модульная архитектура**:
  - `internal/models/` - типы данных и структуры
  - `internal/services/` - бизнес-логика WebSocket
  - `internal/handlers/` - HTTP обработчики
  - `internal/config/` - конфигурация приложения
- **Функции**:
  - Управление комнатами и игроками
  - Обработка фаз игры (lobby, ready, started, finished)
  - Отслеживание кликов и фальстартов
  - WebSocket-коммуникация в реальном времени
  - HTTPS с настраиваемыми SSL сертификатами

### Frontend Components

#### 1. React Frontend
- **Директория**: `frontend/`
- **Технологии**: React 18 + TypeScript + Tailwind CSS
- **Функции**: 
  - Современный интерфейс для админов и участников
  - Управление командами и комнатами
  - Реальное время через WebSocket
  - Адаптивный дизайн для мобильных устройств

#### 2. PowerPoint TaskPane надстройка
- **Файл**: `addin/taskpane.html`
- **Функции**: Подключение игроков и отправка кликов
- **Манифест**: `addin/manifest.xml`

#### 3. PowerPoint Content надстройка
- **Файл**: `addin/content.html`
- **Функции**: Отображение таблицы игроков прямо в слайде
- **Манифест**: `addin/content-manifest.xml`

## 📋 Основные сценарии

### Подключение игрока
```json
{
  "type": "join",
  "quizId": "default",
  "userId": "player1",
  "buttonId": "A"
}
```

### Отправка клика
```json
{
  "type": "click",
  "tsClient": 1640995200000,
  "optionId": "A"
}
```

### Управление фазой (хост)
```json
{
  "type": "host_set_state",
  "phase": "ready",
  "delayMs": 3000
}
```

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `config.env` на основе `config.env.example`:
```bash
# Server Configuration
PORT=443
HOST=0.0.0.0

# TLS Configuration
TLS_ENABLED=true
TLS_CERT_FILE=cert.pem
TLS_KEY_FILE=key.pem
TLS_MIN_VERSION=1.2

# WebSocket Configuration
WS_READ_LIMIT=512
WS_READ_TIMEOUT=60
WS_WRITE_TIMEOUT=10
WS_PING_PERIOD=54
WS_PONG_WAIT=60
WS_MAX_MESSAGE_SIZE=512
```

## 📊 Мониторинг

### WebSocket события
- `join` - подключение игрока
- `click` - клик игрока
- `host_set_state` - изменение фазы
- `state` - обновление состояния комнаты
- `leave` - отключение игрока

### Фазы игры
- **lobby** - ожидание игроков
- **ready** - подготовка к началу (с задержкой)
- **started** - активная фаза (принимаются клики)
- **finished** - завершение игры

## 🛠️ Разработка

### Структура проекта
```
PowerPoint Quiz/
├── backend/                 # Go бэкенд
│   ├── cmd/
│   │   └── server/
│   │       └── main.go      # Основной файл сервера
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go    # Конфигурация приложения
│   │   ├── handlers/
│   │   │   └── handlers.go  # HTTP обработчики
│   │   ├── models/
│   │   │   └── models.go    # Типы данных и структуры
│   │   └── services/
│   │       └── websocket.go # WebSocket сервис
│   ├── go.mod               # Go зависимости
│   ├── go.sum               # Go зависимости (checksums)
│   └── Dockerfile           # Docker образ бэкенда
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # WebSocket сервис
│   │   ├── types/         # TypeScript типы
│   │   ├── utils/         # Утилиты
│   │   ├── App.tsx        # Главный компонент
│   │   └── index.tsx      # Точка входа
│   ├── public/            # Статические файлы
│   ├── package.json       # Зависимости
│   └── README.md         # Документация фронтенда
├── addin/                  # PowerPoint надстройка
│   ├── manifest.xml       # TaskPane манифест
│   ├── taskpane.html      # TaskPane надстройка
│   ├── content-manifest.xml # Content манифест
│   ├── content.html       # Content надстройка
│   ├── README.md          # Документация аддинов
│   └── TASK.md            # Техническая документация
├── certs/                   # SSL сертификаты
├── nginx/                   # Nginx конфигурация
│   ├── nginx.conf          # Основная конфигурация
│   └── ssl/                # SSL сертификаты для nginx
├── docker-compose.yml       # Docker Compose конфигурация
├── deploy.sh               # Автоматический скрипт развертывания
├── generate-certs.sh        # Скрипт генерации сертификатов
├── generate-nginx-certs.sh  # Скрипт генерации nginx сертификатов
├── config.env.example       # Пример конфигурации
├── DEPLOYMENT.md           # Подробное руководство по развертыванию
├── USAGE.md                # Руководство по использованию
├── QUICKSTART.md           # Быстрый старт
└── README.md               # Документация (этот файл)
```

### Разработка бэкенда

```bash
# Перейдите в папку бэкенда
cd backend

# Установите зависимости
go mod tidy

# Запустите сервер в режиме разработки
go run ./cmd/server

# Или соберите бинарный файл
go build -o quiz-server ./cmd/server
./quiz-server
```

### Разработка фронтенда

```bash
# Перейдите в папку фронтенда
cd frontend

# Установите зависимости
npm install

# Запустите в режиме разработки
npm start
```

## 🔒 Безопасность

- WebSocket соединения проверяют origin (настройте для продакшена)
- Валидация всех входящих событий
- Ограничение размера сообщений (512 байт)
- HTTPS/WSS обязателен для продакшена
- Самоподписанные сертификаты для тестирования

## 📱 Совместимость

- **PowerPoint**: Windows, Mac, Web
- **Браузеры**: Chrome, Firefox, Safari, Edge
- **Go**: 1.21+
- **Node.js**: 18+

## 🤝 Поддержка

Для вопросов и предложений создайте issue в репозитории.

## 📄 Лицензия

MIT License - используйте свободно для коммерческих и некоммерческих проектов.
