# PowerPoint Quiz Office Add-ins

Этот проект содержит два Office Web Add-in'а для PowerPoint Quiz системы.

## Структура

```
addin/
├── content-addin/          # Content Add-in (live-таблица на слайде)
│   ├── manifest.xml
│   └── content.html
├── taskpane-addin/         # Task Pane Add-in (панель ведущего)
│   ├── manifest.xml
│   └── taskpane.html
└── shared/                 # Общие ресурсы
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-64.png
    └── icon-80.png
```

## Установка

1. Запустите систему (см. [DEPLOYMENT.md](../DEPLOYMENT.md))
2. В PowerPoint: Insert → My Add-ins → Upload My Add-in
3. Загрузите оба манифеста:
   - `content-addin/manifest.xml`
   - `taskpane-addin/manifest.xml`

## Использование

### Content Add-in (Live-таблица)
- Вставляется прямо на слайд
- Отображает live-таблицу результатов
- Подключается к WebSocket как `viewer`
- Автоматически обновляется при изменениях

### Task Pane Add-in (Панель ведущего)
- Открывается в боковой панели
- Позволяет управлять фазами квиза
- Подключается к WebSocket как `host`
- Кнопки: Ready, Start, Finish, Reset

## WebSocket Протокол

**URL подключения:** `wss://localhost:443/ws?room=ROOM_NAME&role=host|viewer`

**Типы сообщений:**
- `host_set_state` - Изменение фазы квиза (только host)
- `click` - Клик игрока
- `state` - Текущее состояние комнаты

## Разработка

Система использует HTTPS/WSS по умолчанию для безопасности и совместимости с Office Add-ins:
- Автоматическая генерация SSL сертификатов через `./generate-certs.sh`
- WSS WebSocket подключения обязательны для всех клиентов
- Обновите URL в манифестах на продакшен домен при развертывании

## Безопасность

- Только клиенты с ролью `host` могут изменять состояние квиза
- WebSocket соединения проверяют роль клиента
- CSP заголовки настроены для Office окружения

