import React, { useState, useEffect, useCallback } from 'react';
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
  const { connect, isConnected, user, createRoom, joinRoom, authenticateAdmin, error, room, leaveRoom } = useQuiz();
  
  console.log('🔄 [App] Current mode:', mode);
  console.log('🔄 [App] Current isConnected:', isConnected);
  console.log('🔄 [App] Current user:', user);

  useEffect(() => {
    console.log('🚀 [App] useEffect - setting up WebSocket connection');
    
    // Only connect if not already connected
    if (isConnected) {
      console.log('⚠️ [App] Already connected, skipping connection');
      return;
    }
    
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
  }, [isConnected]);

  // Auto-navigate based on user state
  useEffect(() => {
    console.log('🔄 [App] Checking user state for auto-navigation...');
    console.log('🔄 [App] Current user:', user);
    console.log('🔄 [App] Current room:', room);
    console.log('🔄 [App] Current mode:', mode);
    
    // Only auto-navigate if we're in select mode and have valid user/room data
    if (mode === 'select' && user && room && isConnected) {
      if (user.role === 'admin') {
        console.log('🔄 [App] Auto-navigating to admin panel');
        setMode('admin-panel');
      } else if (user.role === 'participant') {
        console.log('🔄 [App] Auto-navigating to participant panel');
        setMode('participant-panel');
      }
    }
  }, [user, room, isConnected]);

  // Handle returning to select mode when user leaves
  useEffect(() => {
    if (!user && !room && mode !== 'select') {
      console.log('🔄 [App] User left room, returning to select mode');
      setMode('select');
    }
  }, [user, room, mode]);

  const handleAdminSuccess = useCallback(() => {
    console.log('✅ [App] handleAdminSuccess() called');
    setMode('admin-panel');
  }, []);
  
  const handleParticipantSuccess = useCallback(() => {
    console.log('✅ [App] handleParticipantSuccess() called');
    setMode('participant-panel');
  }, []);

  const handleAdminClick = useCallback(() => {
    console.log('🔵 [App] Admin button clicked');
    setMode('admin-login');
  }, []);

  const handleParticipantClick = useCallback(() => {
    console.log('🟢 [App] Participant button clicked');
    setMode('participant-login');
  }, []);

  const handleWebSocketTestClick = useCallback(() => {
    console.log('🟣 [App] WebSocket test button clicked');
    setMode('websocket-test');
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Подключение к серверу...</p>
          <p className="text-sm text-gray-500 mt-2">
            Если подключение не удается, проверьте, что backend запущен
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
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
            onClick={handleAdminClick}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Я организатор
          </button>
          <button
            onClick={handleParticipantClick}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Я участник
          </button>
          <button
            onClick={handleWebSocketTestClick}
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
