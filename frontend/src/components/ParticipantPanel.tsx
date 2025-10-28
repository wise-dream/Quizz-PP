import React, { useState, useCallback, useMemo } from 'react';
import { useQuiz } from '../hooks/useQuizRedux';
import { getTeamColor, cn } from '../utils';
import { Users, Zap, Trophy, Clock, LogOut } from 'lucide-react';

export const ParticipantPanel: React.FC = () => {
  const { room, user, joinTeam, sendClick, error, isConnected, leaveRoom } = useQuiz();
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  if (!room || !user) return null;

  const handleJoinTeam = useCallback((teamId: string) => {
    joinTeam(teamId);
    setSelectedTeam(teamId);
  }, [joinTeam]);

  const handleClick = useCallback((buttonId: string) => {
    sendClick(buttonId);
  }, [sendClick]);

  const getPhaseStatus = useCallback(() => {
    switch (room.phase) {
      case 'lobby':
        return { text: 'Ожидание начала', color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'ready':
        return { text: 'Готовность', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'started':
        return { text: 'Игра идет!', color: 'text-green-600', bg: 'bg-green-100' };
      case 'finished':
        return { text: 'Игра завершена', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: 'Неизвестно', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  }, [room.phase]);

  const phaseStatus = getPhaseStatus();
  const playerTeam = useMemo(() => 
    Object.values(room.teams).find(team => team.players.includes(user.id)),
    [room.teams, user.id]
  );

  // Memoize team list
  const teamList = useMemo(() => {
    return Object.values(room.teams).map((team) => {
      const color = getTeamColor(team.color);
      return (
        <button
          key={team.id}
          onClick={() => handleJoinTeam(team.id)}
          className={cn(
            'w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors',
            'flex items-center gap-3 text-left'
          )}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-500">
              {team.players.length} участников • {team.score} очков
            </p>
          </div>
        </button>
      );
    });
  }, [room.teams, handleJoinTeam]);

  // Memoize leaderboard
  const leaderboard = useMemo(() => {
    return Object.values(room.teams)
      .sort((a, b) => b.score - a.score)
      .map((team, index) => {
        const color = getTeamColor(team.color);
        const isPlayerTeam = team.players.includes(user.id);
        
        return (
          <div
            key={team.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg',
              isPlayerTeam ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            )}
          >
            <div className="text-2xl font-bold text-gray-400">
              #{index + 1}
            </div>
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{team.name}</h3>
              <p className="text-sm text-gray-500">
                {team.players.length} участников
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{team.score}</p>
              <p className="text-sm text-gray-500">очков</p>
            </div>
            {isPlayerTeam && (
              <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                Ваша команда
              </div>
            )}
          </div>
        );
      });
  }, [room.teams, user.id]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Добро пожаловать, {user.nickname}!
              </h1>
              <p className="text-gray-600">
                Комната: <span className="font-mono font-bold text-blue-600">{room.code}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Подключено' : 'Отключено'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={cn('px-3 py-1 rounded-full text-sm font-medium', phaseStatus.bg, phaseStatus.color)}>
                  {phaseStatus.text}
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Выйти из комнаты"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Выберите команду
            </h2>
            
            {playerTeam ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: playerTeam.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-green-800">{playerTeam.name}</h3>
                    <p className="text-sm text-green-600">
                      Вы в команде "{playerTeam.name}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {teamList}
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Управление
            </h2>
            
            {room.phase === 'started' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Игра идет! Нажимайте кнопки для ответов
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((button) => (
                    <button
                      key={button}
                      onClick={() => handleClick(button)}
                      className={cn(
                        'py-4 px-6 rounded-lg font-bold text-lg transition-colors',
                        'bg-blue-600 hover:bg-blue-700 text-white',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        'active:scale-95 transform'
                      )}
                    >
                      {button}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {room.phase === 'lobby' && 'Ожидайте начала игры'}
                  {room.phase === 'ready' && 'Готовьтесь к началу!'}
                  {room.phase === 'finished' && 'Игра завершена'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Teams Leaderboard */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Таблица команд
          </h2>
          
          <div className="space-y-3">
            {leaderboard}
          </div>
        </div>
      </div>
    </div>
  );
};
