import React, { useState, useEffect } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { cn } from '../utils';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { createRoom, authenticateAdmin, error, room, user } = useQuiz();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');

  // Watch for successful room creation
  useEffect(() => {
    if (room && user?.role === 'admin' && !isCreating) {
      console.log('Room created successfully, calling onSuccess');
      onSuccess();
    }
  }, [room, user, onSuccess, isCreating]);

  const handleCreateRoom = async () => {
    console.log('🏠 [AdminLogin] handleCreateRoom() called');
    setIsCreating(true);
    try {
      console.log('🏠 [AdminLogin] Calling createRoom...');
      await createRoom();
      console.log('🏠 [AdminLogin] createRoom() completed');
      // Don't call onSuccess here - wait for server response
    } catch (err) {
      console.error('❌ [AdminLogin] Failed to create room:', err);
      setIsCreating(false);
    }
  };

  const handleJoinAsAdmin = async () => {
    console.log('🔐 [AdminLogin] handleJoinAsAdmin() called');
    console.log('🔐 [AdminLogin] Room code:', roomCode);
    console.log('🔐 [AdminLogin] Password:', password ? '[HIDDEN]' : '[EMPTY]');
    
    if (!roomCode || !password) {
      console.log('⚠️ [AdminLogin] Missing room code or password');
      return;
    }
    
    try {
      console.log('🔐 [AdminLogin] Calling authenticateAdmin...');
      await authenticateAdmin(roomCode, password);
      console.log('🔐 [AdminLogin] authenticateAdmin() completed');
      // Don't call onSuccess here - wait for server response
    } catch (err) {
      console.error('❌ [AdminLogin] Failed to authenticate:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PowerPoint Quiz
          </h1>
          <p className="text-gray-600">
            Админ-панель управления квизами
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Create New Room */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Создать новый квиз
            </h2>
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className={cn(
                'w-full py-3 px-6 rounded-lg font-medium transition-colors',
                'bg-blue-600 hover:bg-blue-700 text-white',
                'disabled:bg-gray-400 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              {isCreating ? 'Создание...' : 'Создать квиз'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          {/* Join Existing Room */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Войти в существующий квиз
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код комнаты
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль администратора
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleJoinAsAdmin}
                disabled={!roomCode || !password}
                className={cn(
                  'w-full py-3 px-6 rounded-lg font-medium transition-colors',
                  'bg-green-600 hover:bg-green-700 text-white',
                  'disabled:bg-gray-400 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                )}
              >
                Войти как админ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
