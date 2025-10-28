#!/bin/bash

echo "🧪 Testing PowerPoint Quiz Frontend-Backend Connection"
echo "=================================================="

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:8081/health > /dev/null; then
    echo "✅ Backend is running on port 8081"
else
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && go run cmd/server/main.go"
    exit 1
fi

# Check if frontend is running
echo "🌐 Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend is not running. Please start it first:"
    echo "   cd frontend && npm start"
    exit 1
fi

echo ""
echo "🎯 Test scenarios:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click 'Я организатор' and then 'Создать квиз'"
echo "3. You should see the admin panel with a room code"
echo "4. Open another tab and click 'Я участник'"
echo "5. Try joining with the room code from step 3"
echo "6. Try joining with a non-existent room code (should show error)"
echo ""
echo "📊 Check browser console for WebSocket messages and errors"
echo "📊 Check backend logs for connection and event processing"
