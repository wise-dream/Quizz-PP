import React, { useState, useEffect } from 'react';
import { cn } from '../utils';

interface AdminLoginProps {
  onSuccess: () => void;
  createRoom: (adminName?: string, adminEmail?: string) => void;
  authenticateAdmin: (roomCode: string, password: string) => void;
  error: string | null;
  room: any;
  user: any;
  adminPassword: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, createRoom, authenticateAdmin, error, room, user, adminPassword }) => {
  console.log('🔄 [AdminLogin] AdminLogin component render started');
  
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  
  // Admin data form
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(true);
  
  console.log('🔄 [AdminLogin] Current error:', error);
  console.log('🔄 [AdminLogin] Current room:', room);
  console.log('🔄 [AdminLogin] Current user:', user);

  // Watch for successful room creation
  useEffect(() => {
    if (room && adminPassword && isCreating) {
      console.log('🏠 [AdminLogin] Room created successfully with password');
      console.log('🏠 [AdminLogin] Room data:', room);
      console.log('🔑 [AdminLogin] Admin password:', adminPassword);
      setIsCreating(false); // Reset loading state
      // Don't call onSuccess immediately, show password first
    }
  }, [room, adminPassword, isCreating]);

  // Watch for errors during room creation
  useEffect(() => {
    if (error && isCreating) {
      console.log('❌ [AdminLogin] Error during room creation:', error);
      setIsCreating(false); // Reset loading state
      setShowAdminForm(true); // Show form again
    }
  }, [error, isCreating]);

  const handleCreateRoom = () => {
    console.log('🏠 [AdminLogin] handleCreateRoom() called');
    console.log('🏠 [AdminLogin] Admin name:', adminName);
    console.log('🏠 [AdminLogin] Admin email:', adminEmail);
    
    if (!adminName.trim()) {
      console.log('⚠️ [AdminLogin] Admin name is required');
      return;
    }
    
    setIsCreating(true);
    setShowAdminForm(false);
    
    console.log('🏠 [AdminLogin] Calling createRoom...');
    createRoom(adminName, adminEmail);
    console.log('🏠 [AdminLogin] createRoom() completed');
    // Don't call onSuccess here - wait for server response
  };

  const handleContinueToAdmin = () => {
    console.log('🏠 [AdminLogin] Continuing to admin panel');
    onSuccess();
  };

  const handleJoinAsAdmin = () => {
    console.log('🔐 [AdminLogin] handleJoinAsAdmin() called');
    console.log('🔐 [AdminLogin] Room code:', roomCode);
    console.log('🔐 [AdminLogin] Password:', password ? '[HIDDEN]' : '[EMPTY]');
    
    if (!roomCode || !password) {
      console.log('⚠️ [AdminLogin] Missing room code or password');
      return;
    }
    
    console.log('🔐 [AdminLogin] Calling authenticateAdmin...');
    authenticateAdmin(roomCode, password);
    console.log('🔐 [AdminLogin] authenticateAdmin() completed');
    // Don't call onSuccess here - wait for server response
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
          {/* Admin Data Form */}
          {showAdminForm && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Данные организатора
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (необязательно)
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={!adminName.trim()}
                  className={cn(
                    'w-full py-3 px-6 rounded-lg font-medium transition-colors',
                    'bg-blue-600 hover:bg-blue-700 text-white',
                    'disabled:bg-gray-400 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  )}
                >
                  Создать квиз
                </button>
              </div>
            </div>
          )}

          {/* Creating Room Status */}
          {isCreating && !room && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Создание квиза...</p>
              <p className="text-sm text-gray-500 mt-2">
                Организатор: {adminName}
              </p>
            </div>
          )}

          {/* Room Created Successfully */}
          {room && adminPassword && (
            <div className="text-center">
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600 text-2xl mb-2">✅</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Квиз создан успешно!
                </h3>
                <p className="text-green-700 mb-4">
                  Код комнаты: <span className="font-mono font-bold text-lg">{room.code}</span>
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-300">
                  <p className="text-sm text-gray-600 mb-2">Пароль администратора:</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded">
                    {adminPassword}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Сохраните этот пароль для входа в комнату как администратор
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinueToAdmin}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Перейти к управлению квизом
              </button>
            </div>
          )}

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
                type="button"
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
