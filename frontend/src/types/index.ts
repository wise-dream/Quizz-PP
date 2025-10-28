// Types for PowerPoint Quiz Frontend

export type Phase = 'lobby' | 'ready' | 'started' | 'finished';

export type EventType = 
  | 'join' 
  | 'click' 
  | 'host_set_state' 
  | 'state' 
  | 'leave' 
  | 'error'
  | 'create_room'
  | 'join_team'
  | 'create_team'
  | 'admin_auth'
  | 'room_created'
  | 'join_success'
  | 'join_error'
  | 'admin_reconnect'
  | 'admin_reconnect_success'
  | 'admin_reconnect_error';

export interface Player {
  id: string;
  userId: string;
  buttonId?: string;
  name: string;
  clickCount: number;
  falseStarts: number;
  lastClick: string;
  connected: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  players: string[]; // UserIDs
  score: number;
  createdAt: string;
}

export interface Room {
  id: string;
  code: string;
  phase: Phase;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  enableAt: string;
  createdAt: string;
}

export interface Event {
  type: EventType;
  quizId?: string;
  userId?: string;
  buttonId?: string;
  phase?: Phase;
  delayMs?: number;
  tsClient?: number;
  optionId?: string;
  message?: string;
  data?: any;
  // New fields for team management
  roomCode?: string;
  nickname?: string;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  password?: string;
  adminToken?: string;
  adminName?: string;
  adminEmail?: string;
}

export interface WebSocketMessage {
  type: 'message' | 'error' | 'close';
  data?: any;
  error?: string;
}

export interface User {
  id: string;
  nickname: string;
  role: 'admin' | 'participant';
  roomCode?: string;
  teamId?: string;
}

export interface QuizState {
  room: Room | null;
  user: User | null;
  isConnected: boolean;
  isAdmin: boolean;
  error: string | null;
}
