#!/bin/bash

echo "🧪 Testing Admin Reconnection Fix"
echo "================================="

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build successful"
echo ""
echo "🚀 Starting backend..."
cd ../backend
go run cmd/server/main.go &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

echo "🌐 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8080"
echo ""
echo "🧪 Test Steps:"
echo "1. Open http://localhost:3000"
echo "2. Click 'Я организатор'"
echo "3. Enter admin name and email"
echo "4. Click 'Создать квиз'"
echo "5. Check if room is created successfully"
echo "6. Refresh the page (F5)"
echo "7. Check if admin reconnects automatically"
echo ""
echo "📊 Check browser console for logs:"
echo "- 💾 [useQuiz] Saved admin data to localStorage"
echo "- 💾 [useQuiz] Saved room data to localStorage"
echo "- 🔄 [useQuiz] Checking for admin reconnection..."
echo "- 🔄 [useQuiz] Attempting admin reconnection..."
echo ""
echo "Press Ctrl+C to stop servers"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT
wait
