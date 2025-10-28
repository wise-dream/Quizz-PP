# 🚀 Руководство по развертыванию PowerPoint Quiz

> **Этот файл содержит полную информацию о развертывании проекта.**

## 📋 Варианты развертывания

### 1. Простое развертывание (рекомендуется для начала)
```bash
# Генерация SSL сертификатов
./generate-certs.sh

# Запуск только бэкенда и фронтенда
docker-compose up -d backend frontend
```

**Доступ:**
- Frontend: `http://your-server-ip`
- Backend: `https://your-server-ip:443`
- WebSocket: `wss://your-server-ip:443/ws`

### 2. Полное развертывание с Nginx (продакшен)
```bash
# Генерация SSL сертификатов для nginx
./generate-nginx-certs.sh

# Запуск полного стека
docker-compose --profile production up -d
```

**Доступ:**
- Frontend: `https://your-server-ip:8443`
- Backend: `https://your-server-ip:8443/api/`
- WebSocket: `wss://your-server-ip:8443/ws`

## 🔧 Настройка сервера

### 1. Подготовка сервера
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker и Docker Compose
sudo apt install docker.io docker-compose -y

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Перезагрузка для применения изменений
sudo reboot
```

### 2. Настройка файрвола
```bash
# Установка UFW
sudo apt install ufw -y

# Настройка правил
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Nginx HTTP (если используете)
sudo ufw allow 8443/tcp  # Nginx HTTPS (если используете)

# Включение файрвола
sudo ufw enable
```

### 3. Развертывание приложения
```bash
# Клонирование проекта
git clone <your-repository-url>
cd "PowerPoint Quiz"

# Простое развертывание
./generate-certs.sh
docker-compose up -d backend frontend

# Или полное развертывание
./generate-nginx-certs.sh
docker-compose --profile production up -d
```

## 🔒 HTTPS без домена

### Самоподписанные сертификаты
Да, вы можете использовать HTTPS без домена! Система автоматически генерирует самоподписанные сертификаты:

```bash
# Для простого развертывания
./generate-certs.sh

# Для полного развертывания с nginx
./generate-nginx-certs.sh
```

### Использование с IP адресом
- **Frontend**: `https://your-server-ip` (с предупреждением браузера)
- **WebSocket**: `wss://your-server-ip:443/ws`

### Обход предупреждений браузера
1. Откройте `https://your-server-ip` в браузере
2. Нажмите "Дополнительно" → "Перейти на сайт (небезопасно)"
3. Или добавьте исключение для самоподписанного сертификата

## 🌐 Настройка с доменом (опционально)

### 1. Получение SSL сертификатов от Let's Encrypt
```bash
# Установка Certbot
sudo apt install certbot -y

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
```

### 2. Обновление nginx конфигурации
```bash
# Редактирование nginx.conf
sudo nano nginx/nginx.conf

# Замена server_name _ на server_name your-domain.com
```

## 📊 Мониторинг и управление

### Проверка статуса
```bash
# Статус контейнеров
docker-compose ps

# Логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Перезапуск сервисов
```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart backend
```

### Обновление приложения
```bash
# Остановка сервисов
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose up -d --build
```

## 🔧 Настройка Nginx на хосте (альтернатива)

Если вы хотите использовать nginx на хосте вместо Docker:

### 1. Установка nginx
```bash
sudo apt install nginx -y
```

### 2. Конфигурация
```nginx
# /etc/nginx/sites-available/powerpoint-quiz
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass https://localhost:443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_ssl_verify off;
    }
}
```

### 3. Активация
```bash
sudo ln -s /etc/nginx/sites-available/powerpoint-quiz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚨 Решение проблем

### Проблема: Контейнеры не запускаются
```bash
# Проверка логов
docker-compose logs

# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Проблема: SSL ошибки
```bash
# Проверка сертификатов
openssl x509 -in certs/cert.pem -text -noout

# Перегенерация сертификатов
./generate-certs.sh
```

### Проблема: WebSocket не работает
```bash
# Проверка nginx конфигурации
docker-compose exec nginx nginx -t

# Проверка проксирования
curl -I https://your-server-ip/ws
```

### Проблема: Файрвол блокирует
```bash
# Проверка статуса UFW
sudo ufw status

# Открытие портов
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 📈 Масштабирование

### Горизонтальное масштабирование
```yaml
# В docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
```

### Load Balancer
```nginx
upstream backend {
    server backend1:443;
    server backend2:443;
    server backend3:443;
}
```

## 🎯 Готово!

После выполнения этих шагов у вас будет:
- ✅ **HTTPS сервер** с самоподписанными сертификатами
- ✅ **React фронтенд** на порту 80
- ✅ **Go бэкенд** на порту 443
- ✅ **WebSocket** для реального времени
- ✅ **Nginx** для продакшена (опционально)
- ✅ **Мониторинг** и health checks

Система готова к использованию! 🎉