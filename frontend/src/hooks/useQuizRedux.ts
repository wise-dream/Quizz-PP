import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { WebSocketService } from '../services/websocket';
import { Event, WebSocketMessage } from '../types';
import {
  setConnection,
  setWebSocketService,
  setRoom,
  setUser,
  setError,
  disconnect,
  setAdminData,
} from '../store/quizSlice';

export const useQuiz = () => {
  console.log('🔄 [useQuiz] Redux-based hook render started');
  
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.quiz);
  const wsServiceRef = useRef<WebSocketService | null>(null);
  
  console.log('🔄 [useQuiz] Current Redux state:', state);

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
            const room = event.data as any;
            console.log('🏠 [useQuiz] Room state received:', room);
            dispatch(setRoom(room));
          } else if (event.type === 'error') {
            console.log('❌ [useQuiz] Error event received:', event.message);
            dispatch(setError(event.message || 'Unknown error'));
          } else if (event.type === 'room_created') {
            const room = event.data as any;
            console.log('🏠 [useQuiz] Room created:', room);
            dispatch(setRoom(room));
          } else if (event.type === 'join_success') {
            const room = event.data as any;
            console.log('✅ [useQuiz] Join successful:', room);
            dispatch(setRoom(room));
          } else if (event.type === 'join_error') {
            console.log('❌ [useQuiz] Join error:', event.message);
            dispatch(setError(event.message || 'Failed to join room'));
          } else if (event.type === 'admin_reconnect_success') {
            console.log('✅ [useQuiz] Admin reconnection successful');
            const room = event.data as any;
            dispatch(setRoom(room));
            dispatch(setUser({
              id: `admin_${Date.now()}`,
              nickname: state.adminData?.name || 'Admin',
              role: 'admin',
              roomCode: room.code
            }));
          } else if (event.type === 'admin_reconnect_error') {
            console.log('❌ [useQuiz] Admin reconnection failed:', event.message);
            dispatch(setError(event.message || 'Failed to reconnect as admin'));
          } else {
            console.log('⚠️ [useQuiz] Unknown event type:', event.type);
          }
        } else if (message.type === 'error') {
          console.log('❌ [useQuiz] WebSocket error:', message.error);
          dispatch(setError(message.error || 'Connection error'));
        } else if (message.type === 'close') {
          console.log('🔌 [useQuiz] WebSocket connection closed');
          dispatch(setConnection(false));
        } else {
          console.log('⚠️ [useQuiz] Unknown message type:', message.type);
        }
      });

      console.log('🚀 [useQuiz] Setting WebSocket service...');
      wsServiceRef.current = ws;
      dispatch(setWebSocketService(ws));
      dispatch(setConnection(true));
      
      // If we have a room and admin data, try to reconnect as admin
      if (state.room && state.adminData && state.isAdmin) {
        console.log('🔄 [useQuiz] Attempting admin reconnection...');
        console.log('🔄 [useQuiz] Room:', state.room.code);
        console.log('🔄 [useQuiz] Admin:', state.adminData.name);
        
        // Send admin reconnection event
        const reconnectEvent = {
          type: 'admin_reconnect' as const,
          roomCode: state.room.code,
          adminName: state.adminData.name,
          adminEmail: state.adminData.email,
        };
        
        setTimeout(() => {
          console.log('🔄 [useQuiz] Sending admin reconnect event:', reconnectEvent);
          ws.send(JSON.stringify(reconnectEvent));
        }, 1000); // Wait a bit for connection to stabilize
      }
      
      console.log('✅ [useQuiz] Connection setup complete');
    } catch (error) {
      console.error('❌ [useQuiz] Failed to connect to WebSocket:', error);
      dispatch(setError('Failed to connect to server'));
    }
  }, [dispatch]);

  const disconnectWebSocket = useCallback(() => {
    console.log('🔌 [useQuiz] disconnect() called');
    if (wsServiceRef.current) {
      console.log('🔌 [useQuiz] Disconnecting WebSocket service...');
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
      dispatch(disconnect());
      console.log('✅ [useQuiz] Disconnected successfully');
    } else {
      console.log('⚠️ [useQuiz] No WebSocket service to disconnect');
    }
  }, [dispatch]);

  const sendEvent = useCallback((event: Event) => {
    console.log('📤 [useQuiz] sendEvent() called');
    console.log('📤 [useQuiz] Event to send:', event);
    
    const currentWsService = wsServiceRef.current || state.wsService;
    console.log('📤 [useQuiz] Using WebSocket service:', currentWsService);
    
    if (!currentWsService) {
      console.error('❌ [useQuiz] WebSocket service not available');
      dispatch(setError('WebSocket сервис недоступен. Перезагрузите страницу.'));
      return;
    }
    
    if (!currentWsService.isConnected()) {
      console.error('❌ [useQuiz] WebSocket is not connected');
      dispatch(setError('WebSocket не подключен. Проверьте подключение к серверу.'));
      return;
    }
    
    try {
      currentWsService.send(event);
      console.log('✅ [useQuiz] Event sent successfully:', event);
    } catch (error) {
      console.error('❌ [useQuiz] Error sending event:', error);
      dispatch(setError('Ошибка отправки сообщения: ' + error));
    }
  }, [dispatch, state.wsService]);

  const createRoom = useCallback((adminName?: string, adminEmail?: string) => {
    console.log('🏠 [useQuiz] createRoom() called');
    console.log('🏠 [useQuiz] Admin name:', adminName);
    console.log('🏠 [useQuiz] Admin email:', adminEmail);
    
    // Store admin data if provided
    if (adminName) {
      dispatch(setAdminData({
        name: adminName,
        email: adminEmail || '',
      }));
    }
    
    const event = { type: 'create_room' as const };
    console.log('🏠 [useQuiz] Calling sendEvent with:', event);
    sendEvent(event);
  }, [sendEvent, dispatch]);

  const joinRoom = useCallback((roomCode: string, nickname: string) => {
    console.log('🚪 [useQuiz] joinRoom() called');
    console.log('🚪 [useQuiz] Room code:', roomCode);
    console.log('🚪 [useQuiz] Nickname:', nickname);
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚪 [useQuiz] Generated user ID:', userId);
    
    console.log('🚪 [useQuiz] Updating user state...');
    dispatch(setUser({
      id: userId,
      nickname,
      role: 'participant',
      roomCode,
    }));

    const event = {
      type: 'join' as const,
      quizId: roomCode,
      userId,
      nickname,
    };
    console.log('🚪 [useQuiz] Calling sendEvent with:', event);
    sendEvent(event);
  }, [sendEvent, dispatch]);

  const authenticateAdmin = useCallback((roomCode: string, password: string) => {
    console.log('🔐 [useQuiz] authenticateAdmin() called');
    console.log('🔐 [useQuiz] Room code:', roomCode);
    console.log('🔐 [useQuiz] Password:', password ? '[HIDDEN]' : '[EMPTY]');
    
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔐 [useQuiz] Generated admin user ID:', userId);
    
    dispatch(setUser({
      id: userId,
      nickname: 'Admin',
      role: 'admin',
      roomCode,
    }));

    const event = {
      type: 'admin_auth' as const,
      roomCode,
      password,
    };
    console.log('🔐 [useQuiz] Calling sendEvent with:', event);
    sendEvent(event);
  }, [sendEvent, dispatch]);

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
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    ...state,
    connect,
    disconnect: disconnectWebSocket,
    createRoom,
    joinRoom,
    authenticateAdmin,
    joinTeam,
    createTeam,
    setGamePhase,
    sendClick,
  };
};
