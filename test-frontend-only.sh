#!/bin/bash

echo "🧪 Testing PowerPoint Quiz Frontend (without backend)"
echo "=================================================="

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
echo "🎯 Test scenarios (without backend):"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click '🔧 Тест WebSocket' button"
echo "3. Try to connect to 'ws://localhost:3000/ws'"
echo "4. You should see connection error (expected - no backend)"
echo "5. Try to connect to 'ws://localhost:8081/ws'"
echo "6. You should see connection error (expected - no backend)"
echo ""
echo "📊 Check browser console for WebSocket connection attempts"
echo "📊 Check Network tab for WebSocket connection status"
echo ""
echo "🔍 What to look for:"
echo "- WebSocket connection attempts in Network tab"
echo "- Console logs showing connection attempts"
echo "- Error messages when connection fails"
echo "- Status changes in the test component"
