package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"powerpoint-quiz/internal/models"
	"powerpoint-quiz/internal/services"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	wsService *services.WebSocketService
	upgrader  websocket.Upgrader
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(wsService *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{
		wsService: wsService,
		upgrader:  services.GetUpgrader(),
	}
}

// ServeWS handles WebSocket upgrade requests
func (h *WebSocketHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Parse query parameters
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		roomID = "default"
	}
	role := r.URL.Query().Get("role")
	if role == "" {
		role = "viewer"
	}

	client := &models.Client{
		Conn:   conn,
		Send:   make(chan []byte, 256),
		RoomID: roomID,
		Role:   role,
	}

	h.wsService.GetHub().Register <- client

	go h.writePump(client)
	go h.readPump(client)
}

// readPump handles reading messages from WebSocket connection
func (h *WebSocketHandler) readPump(client *models.Client) {
	defer func() {
		h.wsService.GetHub().Unregister <- client
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(512)
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var event models.Event
		if err := json.Unmarshal(message, &event); err != nil {
			log.Printf("Error unmarshaling event: %v", err)
			continue
		}

		h.wsService.HandleEvent(client, event)
	}
}

// writePump handles writing messages to WebSocket connection
func (h *WebSocketHandler) writePump(client *models.Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(client.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-client.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// StaticHandler handles static file serving
type StaticHandler struct{}

// NewStaticHandler creates a new static file handler
func NewStaticHandler() *StaticHandler {
	return &StaticHandler{}
}

// ServeStatic serves static files
func (h *StaticHandler) ServeStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path[1:] // Remove leading slash

	// Serve add-in files
	if strings.HasPrefix(path, "content-addin/") ||
		strings.HasPrefix(path, "taskpane-addin/") ||
		strings.HasPrefix(path, "shared/") {
		http.ServeFile(w, r, "addin/"+path)
		return
	}

	// Serve web files
	http.ServeFile(w, r, "web/"+path)
}

// SetupRoutes configures all HTTP routes
func SetupRoutes(wsHandler *WebSocketHandler, staticHandler *StaticHandler) *mux.Router {
	r := mux.NewRouter()

	// WebSocket endpoint
	r.HandleFunc("/ws", wsHandler.ServeWS)

	// Static files
	r.PathPrefix("/").HandlerFunc(staticHandler.ServeStatic)

	return r
}
