import { useState, useEffect, useCallback } from 'react';
import { WebSocketService } from '../services/websocket';
import { QuizState, User, Room, Event, WebSocketMessage } from '../types';

export const useQuiz = () => {
  const [state, setState] = useState<QuizState>({
    room: null,
    user: null,
    isConnected: false,
    isAdmin: false,
    error: null,
  });

  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  const connect = useCallback(async (url: string) => {
    console.log('🚀 [useQuiz] connect() called with URL:', url);
    try {
      console.log('🚀 [useQuiz] Creating WebSocket service...');
      const ws = new WebSocketService(url);
      
      console.log('🚀 [useQuiz] Attempting to connect...');
      await ws.connect();
      console.log('✅ [useQuiz] WebSocket connected successfully');
      
      console.log('🚀 [useQuiz] Setting up message handler...');
      ws.onMessage((message: WebSocketMessage) => {
        console.log('📨 [useQuiz] Message handler called with:', message);
        
        if (message.type === 'message' && message.data) {
          const event = message.data as Event;
          console.log('📦 [useQuiz] Processing event:', event);
          
          if (event.type === 'state') {
            const room = event.data as Room;
            console.log('🏠 [useQuiz] Room state received:', room);
            
            setState(prev => {
              console.log('🔄 [useQuiz] Updating state with room:', room);
              return {
                ...prev,
                room: room,
                error: null,
              };
            });
          } else if (event.type === 'error') {
            console.log('❌ [useQuiz] Error event received:', event.message);
            setState(prev => {
              console.log('🔄 [useQuiz] Updating state with error:', event.message);
              return {
                ...prev,
                error: event.message || 'Unknown error',
              };
            });
          } else if (event.type === 'room_created') {
            // Handle room creation response
            const room = event.data as Room;
            console.log('🏠 [useQuiz] Room created:', room);
            
            setState(prev => {
              console.log('🔄 [useQuiz] Updating state with created room:', room);
              return {
                ...prev,
                room: room,
                user: prev.user ? {
                  ...prev.user,
                  roomCode: room.code,
                  role: 'admin'
                } : {
                  id: `admin_${Date.now()}`,
                  nickname: 'Admin',
                  role: 'admin',
                  roomCode: room.code
                },
                isAdmin: true,
                error: null,
              };
            });
          } else if (event.type === 'join_success') {
            // Handle successful join
            const room = event.data as Room;
            console.log('✅ [useQuiz] Join successful:', room);
            
            setState(prev => {
              console.log('🔄 [useQuiz] Updating state with joined room:', room);
              return {
                ...prev,
                room: room,
                error: null,
              };
            });
          } else if (event.type === 'join_error') {
            // Handle join error
            console.log('❌ [useQuiz] Join error:', event.message);
            setState(prev => {
              console.log('🔄 [useQuiz] Updating state with join error:', event.message);
              return {
                ...prev,
                error: event.message || 'Failed to join room',
              };
            });
          } else {
            console.log('⚠️ [useQuiz] Unknown event type:', event.type);
          }
        } else if (message.type === 'error') {
          console.log('❌ [useQuiz] WebSocket error:', message.error);
          setState(prev => {
            console.log('🔄 [useQuiz] Updating state with WebSocket error:', message.error);
            return {
              ...prev,
              error: message.error || 'Connection error',
            };
          });
        } else if (message.type === 'close') {
          console.log('🔌 [useQuiz] WebSocket connection closed');
          setState(prev => {
            console.log('🔄 [useQuiz] Updating state - connection closed');
            return {
              ...prev,
              isConnected: false,
            };
          });
        } else {
          console.log('⚠️ [useQuiz] Unknown message type:', message.type);
        }
      });

      console.log('🚀 [useQuiz] Setting WebSocket service...');
      setWsService(ws);
      console.log('🚀 [useQuiz] Updating state - connected');
      setState(prev => ({
        ...prev,
        isConnected: true,
        error: null,
      }));
      console.log('✅ [useQuiz] Connection setup complete');
    } catch (error) {
      console.error('❌ [useQuiz] Failed to connect to WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect to server',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsService) {
      wsService.disconnect();
      setWsService(null);
      setState(prev => ({
        ...prev,
        isConnected: false,
        room: null,
        user: null,
        isAdmin: false,
      }));
    }
  }, [wsService]);

  const sendEvent = useCallback((event: Event) => {
    console.log('📤 [useQuiz] sendEvent() called');
    console.log('📤 [useQuiz] Event to send:', event);
    console.log('📤 [useQuiz] Event type:', event.type);
    
    if (!wsService) {
      console.error('❌ [useQuiz] WebSocket service not available');
      setState(prev => ({
        ...prev,
        error: 'WebSocket сервис недоступен. Перезагрузите страницу.',
      }));
      return;
    }
    
    console.log('📤 [useQuiz] WebSocket service available, checking connection...');
    if (!wsService.isConnected()) {
      console.error('❌ [useQuiz] WebSocket is not connected');
      setState(prev => ({
        ...prev,
        error: 'WebSocket не подключен. Проверьте подключение к серверу.',
      }));
      return;
    }
    
    console.log('📤 [useQuiz] WebSocket is connected, sending event...');
    try {
      wsService.send(event);
      console.log('✅ [useQuiz] Event sent successfully:', event);
    } catch (error) {
      console.error('❌ [useQuiz] Error sending event:', error);
      setState(prev => ({
        ...prev,
        error: 'Ошибка отправки сообщения: ' + error,
      }));
    }
  }, [wsService]);

  const createRoom = useCallback(() => {
    console.log('🏠 [useQuiz] createRoom() called');
    const event = {
      type: 'create_room' as const,
    };
    console.log('🏠 [useQuiz] Calling sendEvent with:', event);
    sendEvent(event);
  }, [sendEvent]);

  const joinRoom = useCallback((roomCode: string, nickname: string) => {
    console.log('🚪 [useQuiz] joinRoom() called');
    console.log('🚪 [useQuiz] Room code:', roomCode);
    console.log('🚪 [useQuiz] Nickname:', nickname);
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚪 [useQuiz] Generated user ID:', userId);
    
    console.log('🚪 [useQuiz] Updating user state...');
    setState(prev => {
      const newUser = {
        id: userId,
        nickname,
        role: 'participant' as const,
        roomCode,
      };
      console.log('🚪 [useQuiz] New user:', newUser);
      return {
        ...prev,
        user: newUser,
      };
    });

    const event = {
      type: 'join' as const,
      quizId: roomCode,
      userId,
      nickname,
    };
    console.log('🚪 [useQuiz] Calling sendEvent with:', event);
    sendEvent(event);
  }, [sendEvent]);

  const authenticateAdmin = useCallback((roomCode: string, password: string) => {
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setState(prev => ({
      ...prev,
      user: {
        id: userId,
        nickname: 'Admin',
        role: 'admin',
        roomCode,
      },
      isAdmin: true,
    }));

    sendEvent({
      type: 'admin_auth',
      roomCode,
      password,
    });
  }, [sendEvent]);

  const joinTeam = useCallback((teamId: string) => {
    if (!state.user) return;

    sendEvent({
      type: 'join_team',
      userId: state.user.id,
      teamId,
      nickname: state.user.nickname,
    });
  }, [sendEvent, state.user]);

  const createTeam = useCallback((teamName: string, teamColor: string) => {
    sendEvent({
      type: 'create_team',
      teamName,
      teamColor,
    });
  }, [sendEvent]);

  const setGamePhase = useCallback((phase: string, delayMs?: number) => {
    sendEvent({
      type: 'host_set_state',
      phase: phase as any,
      delayMs,
    });
  }, [sendEvent]);

  const sendClick = useCallback((buttonId: string) => {
    if (!state.user) return;

    sendEvent({
      type: 'click',
      userId: state.user.id,
      buttonId,
      tsClient: Date.now(),
    });
  }, [sendEvent, state.user]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    authenticateAdmin,
    joinTeam,
    createTeam,
    setGamePhase,
    sendClick,
  };
};
