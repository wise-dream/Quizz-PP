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
    try {
      const ws = new WebSocketService(url);
      await ws.connect();
      
      ws.onMessage((message: WebSocketMessage) => {
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'message' && message.data) {
          const event = message.data as Event;
          console.log('Processing event:', event);
          
          if (event.type === 'state') {
            const room = event.data as Room;
            console.log('Room state received:', room);
            
            setState(prev => ({
              ...prev,
              room: room,
              error: null,
            }));
          } else if (event.type === 'error') {
            console.log('Error event received:', event.message);
            setState(prev => ({
              ...prev,
              error: event.message || 'Unknown error',
            }));
          } else if (event.type === 'room_created') {
            // Handle room creation response
            const room = event.data as Room;
            console.log('Room created:', room);
            
            setState(prev => ({
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
            }));
          } else if (event.type === 'join_success') {
            // Handle successful join
            const room = event.data as Room;
            console.log('Join successful:', room);
            
            setState(prev => ({
              ...prev,
              room: room,
              error: null,
            }));
          } else if (event.type === 'join_error') {
            // Handle join error
            console.log('Join error:', event.message);
            setState(prev => ({
              ...prev,
              error: event.message || 'Failed to join room',
            }));
          }
        } else if (message.type === 'error') {
          console.log('WebSocket error:', message.error);
          setState(prev => ({
            ...prev,
            error: message.error || 'Connection error',
          }));
        } else if (message.type === 'close') {
          console.log('WebSocket connection closed');
          setState(prev => ({
            ...prev,
            isConnected: false,
          }));
        }
      });

      setWsService(ws);
      setState(prev => ({
        ...prev,
        isConnected: true,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
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
    if (wsService) {
      wsService.send(event);
    }
  }, [wsService]);

  const createRoom = useCallback(() => {
    console.log('Creating room...');
    sendEvent({
      type: 'create_room',
    });
  }, [sendEvent]);

  const joinRoom = useCallback((roomCode: string, nickname: string) => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Joining room:', roomCode, 'with nickname:', nickname);
    
    setState(prev => ({
      ...prev,
      user: {
        id: userId,
        nickname,
        role: 'participant',
        roomCode,
      },
    }));

    sendEvent({
      type: 'join',
      quizId: roomCode,
      userId,
      nickname,
    });
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
