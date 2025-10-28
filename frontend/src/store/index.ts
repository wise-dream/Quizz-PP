import { configureStore } from '@reduxjs/toolkit';
import quizReducer from './quizSlice';

export const store = configureStore({
  reducer: {
    quiz: quizReducer,
  },
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
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
