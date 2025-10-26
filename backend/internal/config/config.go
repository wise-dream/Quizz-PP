package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Server    ServerConfig
	WebSocket WebSocketConfig
	TLS       TLSConfig
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port string
	Host string
}

// WebSocketConfig holds WebSocket specific configuration
type WebSocketConfig struct {
	ReadLimit      int64
	ReadTimeout    int
	WriteTimeout   int
	PingPeriod     int
	PongWait       int
	MaxMessageSize int64
}

// TLSConfig holds TLS/SSL configuration
type TLSConfig struct {
	Enabled    bool
	CertFile   string
	KeyFile    string
	MinVersion string
}

// LoadConfig loads configuration from environment variables with defaults
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "443"),
			Host: getEnv("HOST", "0.0.0.0"),
		},
		WebSocket: WebSocketConfig{
			ReadLimit:      getEnvAsInt64("WS_READ_LIMIT", 512),
			ReadTimeout:    getEnvAsInt("WS_READ_TIMEOUT", 60),
			WriteTimeout:   getEnvAsInt("WS_WRITE_TIMEOUT", 10),
			PingPeriod:     getEnvAsInt("WS_PING_PERIOD", 54),
			PongWait:       getEnvAsInt("WS_PONG_WAIT", 60),
			MaxMessageSize: getEnvAsInt64("WS_MAX_MESSAGE_SIZE", 512),
		},
		TLS: TLSConfig{
			Enabled:    getEnvAsBool("TLS_ENABLED", true),
			CertFile:   getEnv("TLS_CERT_FILE", "cert.pem"),
			KeyFile:    getEnv("TLS_KEY_FILE", "key.pem"),
			MinVersion: getEnv("TLS_MIN_VERSION", "1.2"),
		},
	}
}

// Helper functions for environment variable parsing
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
