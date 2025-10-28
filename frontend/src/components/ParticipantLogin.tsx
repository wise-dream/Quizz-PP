import React, { useState, useEffect } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { cn } from '../utils';

interface ParticipantLoginProps {
  onSuccess: () => void;
}

export const ParticipantLogin: React.FC<ParticipantLoginProps> = ({ onSuccess }) => {
  const { joinRoom, error, room, user } = useQuiz();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');

  // Watch for successful room join
  useEffect(() => {
    if (room && user?.role === 'participant') {
      console.log('Successfully joined room, calling onSuccess');
      onSuccess();
    }
  }, [room, user, onSuccess]);

  const handleJoin = async () => {
    if (!roomCode || !nickname) return;
    
    try {
      console.log('Joining room...');
      await joinRoom(roomCode, nickname);
      // Don't call onSuccess here - wait for server response
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PowerPoint Quiz
          </h1>
          <p className="text-gray-600">
            Присоединиться к квизу
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваш никнейм
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите ваш никнейм"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!roomCode || !nickname}
            className={cn(
              'w-full py-3 px-6 rounded-lg font-medium transition-colors',
              'bg-green-600 hover:bg-green-700 text-white',
              'disabled:bg-gray-400 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            )}
          >
            Присоединиться
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Получите код комнаты от организатора квиза
          </p>
        </div>
      </div>
    </div>
  );
};
