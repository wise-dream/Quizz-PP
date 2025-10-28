package models

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Phase represents the current state of a quiz
type Phase string

const (
	PhaseLobby    Phase = "lobby"
	PhaseReady    Phase = "ready"
	PhaseStarted  Phase = "started"
	PhaseFinished Phase = "finished"
)

// EventType represents different types of WebSocket events
type EventType string

const (
	EventJoin         EventType = "join"
	EventClick        EventType = "click"
	EventHostSetState EventType = "host_set_state"
	EventState        EventType = "state"
	EventLeave        EventType = "leave"
	EventError        EventType = "error"
	EventCreateRoom   EventType = "create_room"
	EventJoinTeam     EventType = "join_team"
	EventCreateTeam   EventType = "create_team"
	EventAdminAuth    EventType = "admin_auth"
	// Additional events for better frontend handling
	EventRoomCreated           EventType = "room_created"
	EventJoinSuccess           EventType = "join_success"
	EventJoinError             EventType = "join_error"
	EventAdminReconnectSuccess EventType = "admin_reconnect_success"
	EventAdminReconnectError   EventType = "admin_reconnect_error"
	EventTeamCreated           EventType = "team_created"
	EventPlayerJoined          EventType = "player_joined"
	EventPlayerLeft            EventType = "player_left"
	EventTeamJoined            EventType = "team_joined"
	EventPhaseChanged          EventType = "phase_changed"
)

// Player represents a quiz participant
type Player struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	ButtonID    string    `json:"buttonId"`
	Name        string    `json:"name"`
	ClickCount  int       `json:"clickCount"`
	FalseStarts int       `json:"falseStarts"`
	LastClick   time.Time `json:"lastClick"`
	Connected   bool      `json:"connected"`
}

// Team represents a team in a quiz
type Team struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	Players   []string  `json:"players"` // UserIDs
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"createdAt"`
}

// Room represents a quiz session
type Room struct {
	ID            string             `json:"id"`
	Code          string             `json:"code"` // 4-character room code
	Phase         Phase              `json:"phase"`
	Players       map[string]*Player `json:"players"`
	Teams         map[string]*Team   `json:"teams"`
	EnableAt      time.Time          `json:"enableAt"`
	CreatedAt     time.Time          `json:"createdAt"`
	LastActivity  time.Time          `json:"lastActivity"` // Last activity timestamp
	AdminPassword string             `json:"-"`            // Not sent to clients
	Mu            sync.RWMutex
}

// Event represents a WebSocket message
type Event struct {
	Type     EventType   `json:"type"`
	QuizID   string      `json:"quizId,omitempty"`
	UserID   string      `json:"userId,omitempty"`
	ButtonID string      `json:"buttonId,omitempty"`
	Phase    Phase       `json:"phase,omitempty"`
	DelayMs  int         `json:"delayMs,omitempty"`
	TsClient int64       `json:"tsClient,omitempty"`
	OptionID string      `json:"optionId,omitempty"`
	Message  string      `json:"message,omitempty"`
	Data     interface{} `json:"data,omitempty"`
	// New fields for team management
	RoomCode   string `json:"roomCode,omitempty"`
	Nickname   string `json:"nickname,omitempty"`
	TeamID     string `json:"teamId,omitempty"`
	TeamName   string `json:"teamName,omitempty"`
	TeamColor  string `json:"teamColor,omitempty"`
	Password   string `json:"password,omitempty"`
	AdminToken string `json:"adminToken,omitempty"`
}

// Client represents a WebSocket connection
type Client struct {
	Conn   *websocket.Conn
	Send   chan []byte
	RoomID string
	UserID string
	Role   string // "host" or "viewer"
}

// Hub manages all rooms and clients
type Hub struct {
	Rooms      map[string]*Room
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte
	Mu         sync.RWMutex
}
