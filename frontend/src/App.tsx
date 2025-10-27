import React, { useState, useEffect } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { ParticipantLogin } from './components/ParticipantLogin';
import { AdminPanel } from './components/AdminPanel';
import { ParticipantPanel } from './components/ParticipantPanel';
import { useQuiz } from './hooks/useQuiz';

type AppMode = 'select' | 'admin-login' | 'participant-login' | 'admin-panel' | 'participant-panel';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('select');
  const { connect, isConnected, user } = useQuiz();

  useEffect(() => {
    // 1) берём из env, 2) иначе строим от window.location с префиксом /quizz/ws
    const wsUrl = (() => {
      const fromEnv = process.env.REACT_APP_WS_URL;
      if (fromEnv && fromEnv.trim()) return fromEnv.trim();
      const { protocol, host } = window.location;
      const scheme = protocol === 'https:' ? 'wss' : 'ws';
      return `${scheme}://${host}/quizz/ws`;
    })();

    // подключаемся один раз на маунт
    connect(wsUrl).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdminSuccess = () => setMode('admin-panel');
  const handleParticipantSuccess = () => setMode('participant-panel');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Подключение к серверу...</p>
        </div>
      </div>
    );
  }

  if (mode === 'admin-login') return <AdminLogin onSuccess={handleAdminSuccess} />;
  if (mode === 'participant-login') return <ParticipantLogin onSuccess={handleParticipantSuccess} />;

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
            onClick={() => setMode('admin-login')}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Я организатор
          </button>
          <button
            onClick={() => setMode('participant-login')}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Я участник
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Выберите свою роль для продолжения</p>
        </div>
      </div>
    </div>
  );
};
