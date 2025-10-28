import React, { useState, useEffect } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { ParticipantLogin } from './components/ParticipantLogin';
import { AdminPanel } from './components/AdminPanel';
import { ParticipantPanel } from './components/ParticipantPanel';
import { WebSocketTest } from './components/WebSocketTest';
import { useQuiz } from './hooks/useQuizRedux';

type AppMode = 'select' | 'admin-login' | 'participant-login' | 'admin-panel' | 'participant-panel' | 'websocket-test';

export const App: React.FC = () => {
  console.log('🔄 [App] App component render started');
  
  const [mode, setMode] = useState<AppMode>('select');
  const { connect, isConnected, user, createRoom, joinRoom, authenticateAdmin, error, room } = useQuiz();
  
  console.log('🔄 [App] Current mode:', mode);
  console.log('🔄 [App] Current isConnected:', isConnected);
  console.log('🔄 [App] Current user:', user);

  useEffect(() => {
    console.log('🚀 [App] useEffect - setting up WebSocket connection');
    // 1) берём из env, 2) иначе строим от window.location с правильным путем
    const wsUrl = (() => {
      const fromEnv = process.env.REACT_APP_WS_URL;
      if (fromEnv && fromEnv.trim()) {
        console.log('🌐 [App] Using WebSocket URL from env:', fromEnv);
        return fromEnv.trim();
      }
      
      // В development режиме используем proxy через React dev server
      if (process.env.NODE_ENV === 'development') {
        const devUrl = 'ws://localhost:3000/ws';
        console.log('🌐 [App] Using development WebSocket URL:', devUrl);
        return devUrl;
      }
      
      // В production строим от window.location
      const { protocol, host } = window.location;
      const scheme = protocol === 'https:' ? 'wss' : 'ws';
      const prodUrl = `${scheme}://${host}/ws`;
      console.log('🌐 [App] Using production WebSocket URL:', prodUrl);
      return prodUrl;
    })();

    console.log('🔌 [App] Final WebSocket URL:', wsUrl);
    console.log('🔌 [App] Calling connect...');
    // подключаемся один раз на маунт
    connect(wsUrl).catch((error) => {
      console.error('❌ [App] Connection failed:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-navigate based on user state
  useEffect(() => {
    console.log('🔄 [App] Checking user state for auto-navigation...');
    console.log('🔄 [App] Current user:', user);
    console.log('🔄 [App] Current room:', room);
    console.log('🔄 [App] Current mode:', mode);
    
    if (user && room && isConnected) {
      if (user.role === 'admin' && mode === 'select') {
        console.log('🔄 [App] Auto-navigating to admin panel');
        setMode('admin-panel');
      } else if (user.role === 'participant' && mode === 'select') {
        console.log('🔄 [App] Auto-navigating to participant panel');
        setMode('participant-panel');
      }
    }
  }, [user, room, isConnected, mode]);

  const handleAdminSuccess = () => {
    console.log('✅ [App] handleAdminSuccess() called');
    setMode('admin-panel');
  };
  
  const handleParticipantSuccess = () => {
    console.log('✅ [App] handleParticipantSuccess() called');
    setMode('participant-panel');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Подключение к серверу...</p>
          <p className="text-sm text-gray-500 mt-2">
            Если подключение не удается, проверьте, что backend запущен на порту 8081
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'admin-login') return <AdminLogin onSuccess={handleAdminSuccess} createRoom={createRoom} authenticateAdmin={authenticateAdmin} error={error} room={room} user={user} />;
  if (mode === 'participant-login') return <ParticipantLogin onSuccess={handleParticipantSuccess} joinRoom={joinRoom} error={error} room={room} user={user} />;
  if (mode === 'websocket-test') return <WebSocketTest />;

  if (mode === 'admin-panel' && user?.role === 'admin') return <AdminPanel />;
  if (mode === 'participant-panel' && user?.role === 'participant') return <ParticipantPanel />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PowerPoint Quiz</h1>
          <p className="text-gray-600">Интерактивная система проведения квизов</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              console.log('🔵 [App] Admin button clicked');
              setMode('admin-login');
            }}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Я организатор
          </button>
          <button
            onClick={() => {
              console.log('🟢 [App] Participant button clicked');
              setMode('participant-login');
            }}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Я участник
          </button>
          <button
            onClick={() => {
              console.log('🟣 [App] WebSocket test button clicked');
              setMode('websocket-test');
            }}
            className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            🔧 Тест WebSocket
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Выберите свою роль для продолжения</p>
        </div>
      </div>
    </div>
  );
};
