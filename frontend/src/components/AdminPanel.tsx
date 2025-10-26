import React, { useState } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { teamColors, getTeamColor, cn } from '../utils';
import { Plus, Users, Play, Pause, Square, Settings } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { room, user, createTeam, setGamePhase, error } = useQuiz();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(teamColors[0].value);

  if (!room || !user) return null;

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    
    createTeam(newTeamName, newTeamColor);
    setNewTeamName('');
    setShowCreateTeam(false);
  };

  const getPhaseButton = (phase: string, label: string, icon: React.ReactNode, color: string) => (
    <button
      onClick={() => setGamePhase(phase)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
        `bg-${color}-600 hover:bg-${color}-700 text-white`,
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        `focus:ring-${color}-500`
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Админ-панель
              </h1>
              <p className="text-gray-600">
                Комната: <span className="font-mono font-bold text-blue-600">{room.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Участников</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(room.players).length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Управление игрой
            </h2>
            <div className="space-y-3">
              {getPhaseButton('lobby', 'Ожидание', <Users className="w-4 h-4" />, 'gray')}
              {getPhaseButton('ready', 'Готовность', <Play className="w-4 h-4" />, 'yellow')}
              {getPhaseButton('started', 'Начало', <Play className="w-4 h-4" />, 'green')}
              {getPhaseButton('finished', 'Завершение', <Square className="w-4 h-4" />, 'red')}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Текущая фаза: <span className="font-semibold">{room.phase}</span>
              </p>
            </div>
          </div>

          {/* Teams Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Команды
              </h2>
              <button
                onClick={() => setShowCreateTeam(!showCreateTeam)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {showCreateTeam && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Название команды"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {teamColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTeamColor(color.value)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          newTeamColor === color.value ? 'border-gray-800' : 'border-gray-300'
                        )}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTeam}
                      className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Создать
                    </button>
                    <button
                      onClick={() => setShowCreateTeam(false)}
                      className="flex-1 py-2 px-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {Object.values(room.teams).map((team) => {
                const color = getTeamColor(team.color);
                return (
                  <div
                    key={team.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-500">
                          {team.players.length} участников
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{team.score}</p>
                        <p className="text-xs text-gray-500">очков</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Участники
            </h2>
            <div className="space-y-2">
              {Object.values(room.players).map((player) => {
                const playerTeam = Object.values(room.teams).find(team => 
                  team.players.includes(player.userId)
                );
                const teamColor = playerTeam ? getTeamColor(playerTeam.color) : null;
                
                return (
                  <div
                    key={player.userId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{player.name}</p>
                      {playerTeam && (
                        <p className="text-sm text-gray-500">{playerTeam.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{player.clickCount}</p>
                      <p className="text-xs text-gray-500">кликов</p>
                    </div>
                    {teamColor && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: teamColor.value }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
