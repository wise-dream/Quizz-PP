package services

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"powerpoint-quiz/internal/models"

	"github.com/gorilla/websocket"
)

// WebSocketService handles WebSocket connections and events
type WebSocketService struct {
	hub *models.Hub
}

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService() *WebSocketService {
	return &WebSocketService{
		hub: &models.Hub{
			Rooms:      make(map[string]*models.Room),
			Clients:    make(map[*models.Client]bool),
			Register:   make(chan *models.Client),
			Unregister: make(chan *models.Client),
			Broadcast:  make(chan []byte),
		},
	}
}

// GetHub returns the hub instance
func (ws *WebSocketService) GetHub() *models.Hub {
	return ws.hub
}

// generateRoomCode generates a random 4-character room code
func generateRoomCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 4)
	for i := range code {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		code[i] = charset[num.Int64()]
	}
	return string(code)
}

// generateAdminPassword generates a random admin password
func generateAdminPassword() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	password := make([]byte, 6)
	for i := range password {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[num.Int64()]
	}
	return string(password)
}

// Run starts the hub's main loop
func (ws *WebSocketService) Run() {
	for {
		select {
		case client := <-ws.hub.Register:
			ws.hub.Clients[client] = true
			log.Printf("Client connected: %s", client.UserID)

		case client := <-ws.hub.Unregister:
			if _, ok := ws.hub.Clients[client]; ok {
				delete(ws.hub.Clients, client)
				close(client.Send)
				log.Printf("Client disconnected: %s", client.UserID)
			}

		case message := <-ws.hub.Broadcast:
			for client := range ws.hub.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(ws.hub.Clients, client)
				}
			}
		}
	}
}

// HandleEvent processes incoming WebSocket events
func (ws *WebSocketService) HandleEvent(client *models.Client, event models.Event) {
	ws.hub.Mu.Lock()
	defer ws.hub.Mu.Unlock()

	roomID := event.QuizID
	if roomID == "" {
		roomID = client.RoomID // Use client's room if not specified
	}

	// Get or create room
	room, exists := ws.hub.Rooms[roomID]
	if !exists && event.Type != models.EventCreateRoom {
		// For non-create-room events, check if room exists
		room = nil
	} else if !exists {
		// Only create room for create_room events
		room = &models.Room{
			ID:        roomID,
			Phase:     models.PhaseLobby,
			Players:   make(map[string]*models.Player),
			Teams:     make(map[string]*models.Team),
			CreatedAt: time.Now(),
		}
		ws.hub.Rooms[roomID] = room
	}

	switch event.Type {
	case models.EventCreateRoom:
		ws.handleCreateRoom(client, event)

	case models.EventAdminAuth:
		ws.handleAdminAuth(client, event)

	case models.EventJoinTeam:
		if room != nil {
			room.Mu.Lock()
			ws.handleJoinTeam(client, room, event)
			room.Mu.Unlock()
		}

	case models.EventCreateTeam:
		if room != nil {
			room.Mu.Lock()
			ws.handleCreateTeam(client, room, event)
			room.Mu.Unlock()
		}

	case models.EventJoin:
		ws.handleJoin(client, room, event)

	case models.EventClick:
		if room != nil {
			room.Mu.Lock()
			ws.handleClick(client, room, event)
			room.Mu.Unlock()
		}

	case models.EventHostSetState:
		if room != nil {
			room.Mu.Lock()
			ws.handleHostSetState(client, room, event)
			room.Mu.Unlock()
		}
	}
}

// handleJoin processes player join events
func (ws *WebSocketService) handleJoin(client *models.Client, room *models.Room, event models.Event) {
	// Check if room exists
	if room == nil {
		log.Printf("Room not found for join request: %s", event.QuizID)
		errorEvent := models.Event{
			Type:    models.EventJoinError,
			Message: "Room not found",
		}
		ws.sendEventToClient(client, errorEvent)
		return
	}

	room.Mu.Lock()
	defer room.Mu.Unlock()

	player := &models.Player{
		ID:        event.UserID,
		UserID:    event.UserID,
		ButtonID:  event.ButtonID,
		Name:      event.Nickname,
		Connected: true,
	}
	room.Players[event.UserID] = player
	client.UserID = event.UserID
	client.RoomID = room.Code
	log.Printf("Player %s joined room %s", event.UserID, room.Code)

	// Send success response with specific event type
	successEvent := models.Event{
		Type: models.EventJoinSuccess,
		Data: room,
	}
	ws.sendEventToClient(client, successEvent)

	// Also send state event for compatibility
	stateEvent := models.Event{
		Type: models.EventState,
		Data: room,
	}
	ws.sendEventToClient(client, stateEvent)

	// Broadcast player joined event to all clients in the room
	playerJoinedEvent := models.Event{
		Type:   models.EventPlayerJoined,
		UserID: event.UserID,
		Data:   player,
	}
	ws.broadcastToRoom(room, playerJoinedEvent)

	// Broadcast to all clients in the room
	ws.broadcastRoomState(room)
}

// handleClick processes player click events
func (ws *WebSocketService) handleClick(client *models.Client, room *models.Room, event models.Event) {
	player, exists := room.Players[event.UserID]
	if !exists {
		// Auto-create player if not exists
		player = &models.Player{
			ID:        event.UserID,
			UserID:    event.UserID,
			ButtonID:  event.ButtonID,
			Name:      fmt.Sprintf("Player %s", event.UserID),
			Connected: true,
		}
		room.Players[event.UserID] = player
	}

	clickTime := time.Now()
	player.LastClick = clickTime
	player.ClickCount++

	// Check for false start
	if room.Phase != models.PhaseStarted || clickTime.Before(room.EnableAt) {
		player.FalseStarts++
		log.Printf("False start by player %s", event.UserID)
	}

	log.Printf("Player %s clicked (total: %d, false starts: %d)",
		event.UserID, player.ClickCount, player.FalseStarts)
	ws.broadcastRoomState(room)
}

// handleHostSetState processes host state change events
func (ws *WebSocketService) handleHostSetState(client *models.Client, room *models.Room, event models.Event) {
	// Only allow host role to change state
	if client.Role != "host" {
		log.Printf("Non-host client attempted to change state")
		return
	}

	if event.Phase == models.PhaseReady {
		room.Phase = models.PhaseReady
		room.EnableAt = time.Now().Add(time.Duration(event.DelayMs) * time.Millisecond)

		// Auto-transition to started after delay
		go func() {
			time.Sleep(time.Duration(event.DelayMs) * time.Millisecond)
			room.Mu.Lock()
			room.Phase = models.PhaseStarted
			room.Mu.Unlock()
			ws.broadcastRoomState(room)
		}()
	} else {
		room.Phase = event.Phase
	}

	log.Printf("Room %s phase changed to %s by host", room.ID, event.Phase)
	ws.broadcastRoomState(room)
}

// broadcastRoomState sends room state to all clients in the room
func (ws *WebSocketService) broadcastRoomState(room *models.Room) {
	stateEvent := models.Event{
		Type: models.EventState,
		Data: room,
	}

	message, err := json.Marshal(stateEvent)
	if err != nil {
		log.Printf("Error marshaling state: %v", err)
		return
	}

	// Broadcast to all clients in the room
	for client := range ws.hub.Clients {
		if client.RoomID == room.Code {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(ws.hub.Clients, client)
			}
		}
	}
}

// broadcastToRoom sends an event to all clients in a specific room
func (ws *WebSocketService) broadcastToRoom(room *models.Room, event models.Event) {
	message, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	// Broadcast to all clients in the room
	for client := range ws.hub.Clients {
		if client.RoomID == room.Code {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(ws.hub.Clients, client)
			}
		}
	}
}

// handleCreateRoom processes room creation events
func (ws *WebSocketService) handleCreateRoom(client *models.Client, event models.Event) {
	roomCode := generateRoomCode()
	adminPassword := generateAdminPassword()

	room := &models.Room{
		ID:            fmt.Sprintf("room_%d", time.Now().Unix()),
		Code:          roomCode,
		Phase:         models.PhaseLobby,
		Players:       make(map[string]*models.Player),
		Teams:         make(map[string]*models.Team),
		CreatedAt:     time.Now(),
		AdminPassword: adminPassword,
	}

	ws.hub.Rooms[roomCode] = room
	client.RoomID = roomCode
	client.Role = "admin"

	log.Printf("Room created: %s, Admin password: %s", roomCode, adminPassword)

	// Send room creation response with specific event type
	response := models.Event{
		Type:       models.EventRoomCreated,
		Data:       room,
		AdminToken: adminPassword,
	}

	ws.sendEventToClient(client, response)

	// Also send state event for compatibility
	stateResponse := models.Event{
		Type: models.EventState,
		Data: room,
	}
	ws.sendEventToClient(client, stateResponse)

	// Also broadcast to all clients in the room
	ws.broadcastRoomState(room)
}

// handleAdminAuth processes admin authentication
func (ws *WebSocketService) handleAdminAuth(client *models.Client, event models.Event) {
	room, exists := ws.hub.Rooms[event.RoomCode]
	if !exists {
		ws.sendErrorToClient(client, "Room not found")
		return
	}

	if room.AdminPassword != event.Password {
		ws.sendErrorToClient(client, "Invalid admin password")
		return
	}

	client.RoomID = event.RoomCode
	client.Role = "admin"

	log.Printf("Admin authenticated for room: %s", event.RoomCode)
	ws.broadcastRoomState(room)
}

// handleJoinTeam processes team join events
func (ws *WebSocketService) handleJoinTeam(client *models.Client, room *models.Room, event models.Event) {
	player, exists := room.Players[event.UserID]
	if !exists {
		// Create player if not exists
		player = &models.Player{
			ID:        event.UserID,
			UserID:    event.UserID,
			Name:      event.Nickname,
			Connected: true,
		}
		room.Players[event.UserID] = player
	} else {
		player.Name = event.Nickname
	}

	// Add player to team
	if team, exists := room.Teams[event.TeamID]; exists {
		// Remove player from other teams first
		for _, t := range room.Teams {
			for i, p := range t.Players {
				if p == event.UserID {
					t.Players = append(t.Players[:i], t.Players[i+1:]...)
					break
				}
			}
		}

		// Add to new team
		team.Players = append(team.Players, event.UserID)
		log.Printf("Player %s joined team %s", event.Nickname, team.Name)

		// Send team joined event to all clients in the room
		teamJoinedEvent := models.Event{
			Type:     models.EventTeamJoined,
			UserID:   event.UserID,
			TeamID:   event.TeamID,
			TeamName: team.Name,
			Data:     player,
		}
		ws.broadcastToRoom(room, teamJoinedEvent)
	}

	ws.broadcastRoomState(room)
}

// handleCreateTeam processes team creation events
func (ws *WebSocketService) handleCreateTeam(client *models.Client, room *models.Room, event models.Event) {
	if client.Role != "admin" {
		ws.sendErrorToClient(client, "Only admin can create teams")
		return
	}

	teamID := fmt.Sprintf("team_%d", time.Now().Unix())
	team := &models.Team{
		ID:        teamID,
		Name:      event.TeamName,
		Color:     event.TeamColor,
		Players:   []string{},
		Score:     0,
		CreatedAt: time.Now(),
	}

	room.Teams[teamID] = team
	log.Printf("Team created: %s (%s)", event.TeamName, teamID)

	// Send team created event to all clients in the room
	teamCreatedEvent := models.Event{
		Type:      models.EventTeamCreated,
		TeamID:    teamID,
		TeamName:  event.TeamName,
		TeamColor: event.TeamColor,
		Data:      team,
	}
	ws.broadcastToRoom(room, teamCreatedEvent)

	// Also broadcast room state
	ws.broadcastRoomState(room)
}

// sendEventToClient sends an event to a specific client
func (ws *WebSocketService) sendEventToClient(client *models.Client, event models.Event) {
	message, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	select {
	case client.Send <- message:
	default:
		close(client.Send)
		delete(ws.hub.Clients, client)
	}
}

// sendErrorToClient sends an error message to a specific client
func (ws *WebSocketService) sendErrorToClient(client *models.Client, message string) {
	errorEvent := models.Event{
		Type:    models.EventError,
		Message: message,
	}
	ws.sendEventToClient(client, errorEvent)
}

func parseAllowedOrigins() []string {
	raw := os.Getenv("WS_ALLOWED_ORIGINS")
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, strings.TrimRight(p, "/"))
		}
	}
	return out
}

var allowedOrigins = parseAllowedOrigins()

func checkSameHost(origin string, host string) bool {
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	originHost := u.Hostname()
	return (u.Scheme == "https" || u.Scheme == "http") && strings.EqualFold(originHost, host)
}

func originAllowed(origin, host string) bool {
	if origin == "" {
		return true
	}

	for _, allowed := range allowedOrigins {
		if strings.EqualFold(strings.TrimRight(origin, "/"), allowed) {
			return true
		}
	}

	if checkSameHost(origin, host) {
		return true
	}

	return false
}

// GetUpgrader returns a configured WebSocket upgrader
func GetUpgrader() websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  4096,
		WriteBufferSize: 4096,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			ok := originAllowed(origin, r.Host)
			if !ok {
				log.Printf("[WS] CheckOrigin reject: origin=%q host=%q allowed=%v ua=%q",
					origin, r.Host, allowedOrigins, r.UserAgent())
			} else {
				log.Printf("[WS] CheckOrigin ok: origin=%q host=%q", origin, r.Host)
			}
			return ok
		},
	}
}

// updateRoomActivity updates the last activity timestamp for a room
func (ws *WebSocketService) updateRoomActivity(room *models.Room) {
	if room != nil {
		room.Mu.Lock()
		room.LastActivity = time.Now()
		room.Mu.Unlock()
		log.Printf("Updated activity for room %s", room.Code)
	}
}

// cleanupInactiveRooms removes rooms that haven't been active for more than 1 hour
func (ws *WebSocketService) cleanupInactiveRooms() {
	ws.hub.Mu.Lock()
	defer ws.hub.Mu.Unlock()

	cutoffTime := time.Now().Add(-1 * time.Hour)
	var roomsToDelete []string

	for roomCode, room := range ws.hub.Rooms {
		room.Mu.RLock()
		lastActivity := room.LastActivity
		room.Mu.RUnlock()

		if lastActivity.Before(cutoffTime) {
			roomsToDelete = append(roomsToDelete, roomCode)
			log.Printf("Room %s marked for deletion (last activity: %v)", roomCode, lastActivity)
		}
	}

	// Delete inactive rooms
	for _, roomCode := range roomsToDelete {
		delete(ws.hub.Rooms, roomCode)
		log.Printf("Deleted inactive room: %s", roomCode)
	}

	if len(roomsToDelete) > 0 {
		log.Printf("Cleaned up %d inactive rooms", len(roomsToDelete))
	}
}

// StartRoomCleanup starts a background goroutine to clean up inactive rooms every 30 minutes
func (ws *WebSocketService) StartRoomCleanup() {
	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()

		log.Println("Room cleanup service started (runs every 30 minutes)")

		for {
			select {
			case <-ticker.C:
				log.Println("Running room cleanup...")
				ws.cleanupInactiveRooms()
			}
		}
	}()
}
