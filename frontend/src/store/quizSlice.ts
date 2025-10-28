import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, User } from '../types';

export interface QuizState {
  room: Room | null;
  user: User | null;
  isConnected: boolean;
  isAdmin: boolean;
  error: string | null;
  wsService: any | null;
  adminData: {
    name: string;
    email: string;
  } | null;
}

const initialState: QuizState = {
  room: null,
  user: null,
  isConnected: false,
  isAdmin: false,
  error: null,
  wsService: null,
  adminData: null,
};

export const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setConnection: (state, action: PayloadAction<boolean>) => {
      console.log('🔄 [Redux] setConnection:', action.payload);
      state.isConnected = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },
    
    setWebSocketService: (state, action: PayloadAction<any>) => {
      console.log('🔄 [Redux] setWebSocketService:', action.payload);
      state.wsService = action.payload;
    },
    
    setRoom: (state, action: PayloadAction<Room | null>) => {
      console.log('🔄 [Redux] setRoom:', action.payload);
      state.room = action.payload;
      state.error = null;
      
      // Auto-create admin user if room is created and no user exists
      if (action.payload && !state.user) {
        state.user = {
          id: `admin_${Date.now()}`,
          nickname: state.adminData?.name || 'Admin',
          role: 'admin',
          roomCode: action.payload.code
        };
        state.isAdmin = true;
      }
    },
    
    setUser: (state, action: PayloadAction<User | null>) => {
      console.log('🔄 [Redux] setUser:', action.payload);
      state.user = action.payload;
      state.isAdmin = action.payload?.role === 'admin';
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      console.log('🔄 [Redux] setError:', action.payload);
      state.error = action.payload;
    },
    
    clearError: (state) => {
      console.log('🔄 [Redux] clearError');
      state.error = null;
    },
    
    resetQuiz: (state) => {
      console.log('🔄 [Redux] resetQuiz');
      state.room = null;
      state.user = null;
      state.isAdmin = false;
      state.error = null;
      state.adminData = null;
      // Keep connection and wsService
      
      // Clear localStorage
      try {
        localStorage.removeItem('quiz_state');
        localStorage.removeItem('quiz_room_data');
        localStorage.removeItem('quiz_admin_data');
        console.log('🗑️ [Redux] Cleared localStorage');
      } catch (err) {
        console.error('❌ [Redux] Error clearing localStorage:', err);
      }
    },
    
    disconnect: (state) => {
      console.log('🔄 [Redux] disconnect');
      state.isConnected = false;
      state.wsService = null;
      // Keep room, user, isAdmin persistent - don't clear them on disconnect
      // This allows for reconnection without losing state
    },
    
    setAdminData: (state, action: PayloadAction<{ name: string; email: string }>) => {
      console.log('🔄 [Redux] setAdminData:', action.payload);
      state.adminData = action.payload;
    },
  },
});

export const {
  setConnection,
  setWebSocketService,
  setRoom,
  setUser,
  setError,
  clearError,
  resetQuiz,
  disconnect,
  setAdminData,
} = quizSlice.actions;

export default quizSlice.reducer;
