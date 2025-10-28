import { configureStore } from '@reduxjs/toolkit';
import quizReducer from './quizSlice';

// Load initial state from localStorage
const loadStateFromStorage = () => {
  try {
    const serializedState = localStorage.getItem('quiz_state');
    if (serializedState === null) {
      return undefined;
    }
    const parsedState = JSON.parse(serializedState);
    console.log('🔄 [Store] Loaded state from localStorage:', parsedState);
    return parsedState;
  } catch (err) {
    console.error('❌ [Store] Error loading state from localStorage:', err);
    return undefined;
  }
};

// Save state to localStorage middleware
const saveStateToStorage = (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  
  // Save only specific parts of state to localStorage
  const state = store.getState();
  const stateToSave = {
    quiz: {
      room: state.quiz.room,
      user: state.quiz.user,
      isAdmin: state.quiz.isAdmin,
      adminData: state.quiz.adminData,
      // Don't save connection state, wsService, or error
    }
  };
  
  try {
    localStorage.setItem('quiz_state', JSON.stringify(stateToSave));
    console.log('💾 [Store] Saved state to localStorage:', stateToSave);
  } catch (err) {
    console.error('❌ [Store] Error saving state to localStorage:', err);
  }
  
  return result;
};

export const store = configureStore({
  reducer: {
    quiz: quizReducer,
  },
  preloadedState: loadStateFromStorage(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['quiz/setWebSocketService'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.wsService'],
        // Ignore these paths in the state
        ignoredPaths: ['quiz.wsService'],
      },
    }).concat(saveStateToStorage),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
