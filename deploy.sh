#!/bin/bash

# PowerPoint Quiz Quick Deploy Script

set -e

echo "🚀 PowerPoint Quiz - Быстрое развертывание"
echo "=========================================="

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Выбор режима развертывания
echo ""
echo "Выберите режим развертывания:"
echo "1) Простое развертывание (только бэкенд + фронтенд)"
echo "2) Полное развертывание (с nginx reverse proxy)"
echo "3) Только бэкенд (для разработки)"
read -p "Введите номер (1-3): " choice

case $choice in
    1)
        echo "📦 Простое развертывание..."
        
        # Генерация SSL сертификатов
        echo "🔐 Генерация SSL сертификатов..."
        ./generate-certs.sh
        
        # Запуск сервисов
        echo "🐳 Запуск Docker контейнеров..."
        docker-compose up -d backend frontend
        
        echo ""
        echo "✅ Развертывание завершено!"
        echo "🌐 Frontend: http://$(hostname -I | awk '{print $1}')"
        echo "🔒 Backend: https://$(hostname -I | awk '{print $1}'):443"
        echo "🔌 WebSocket: wss://$(hostname -I | awk '{print $1}'):443/ws"
        ;;
        
    2)
        echo "📦 Полное развертывание с nginx..."
        
        # Генерация SSL сертификатов
        echo "🔐 Генерация SSL сертификатов..."
        ./generate-certs.sh
        ./generate-nginx-certs.sh
        
        # Запуск всех сервисов
        echo "🐳 Запуск Docker контейнеров..."
        docker-compose --profile production up -d
        
        echo ""
        echo "✅ Развертывание завершено!"
        echo "🌐 Frontend: https://$(hostname -I | awk '{print $1}'):8443"
        echo "🔒 Backend: https://$(hostname -I | awk '{print $1}'):8443/api/"
        echo "🔌 WebSocket: wss://$(hostname -I | awk '{print $1}'):8443/ws"
        ;;
        
    3)
        echo "📦 Только бэкенд..."
        
        # Генерация SSL сертификатов
        echo "🔐 Генерация SSL сертификатов..."
        ./generate-certs.sh
        
        # Запуск только бэкенда
        echo "🐳 Запуск Docker контейнера..."
        docker-compose up -d backend
        
        echo ""
        echo "✅ Развертывание завершено!"
        echo "🔒 Backend: https://$(hostname -I | awk '{print $1}'):443"
        echo "🔌 WebSocket: wss://$(hostname -I | awk '{print $1}'):443/ws"
        echo "📝 Для фронтенда запустите: cd frontend && npm start"
        echo "📝 Для бэкенда запустите: cd backend && go run ./cmd/server"
        ;;
        
    *)
        echo "❌ Неверный выбор. Запустите скрипт снова."
        exit 1
        ;;
esac

echo ""
echo "📊 Проверка статуса:"
docker-compose ps

echo ""
echo "📋 Полезные команды:"
echo "  docker-compose logs -f          # Просмотр логов"
echo "  docker-compose restart          # Перезапуск сервисов"
echo "  docker-compose down              # Остановка сервисов"
echo "  docker-compose ps                # Статус контейнеров"

echo ""
echo "🎉 Готово! Система запущена и готова к использованию."
