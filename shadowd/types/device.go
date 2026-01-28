package types

import (
	"time"
)

// Device represents a device in the Mesh network
type Device struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OS        string    `json:"os"`
	OSVersion string    `json:"os_version"`
	MeshIP    string    `json:"mesh_ip"`
	PublicKey string    `json:"public_key"`
	IsOnline  bool      `json:"is_online"`
	LastSeen  time.Time `json:"last_seen"`
	SSHPort   int       `json:"ssh_port"`
	GRPCPort  int       `json:"grpc_port"`
}

// PairingCode represents the data encoded in a pairing QR code
type PairingCode struct {
	DeviceID   string `json:"device_id"`
	DeviceName string `json:"device_name"`
	MeshIP     string `json:"mesh_ip"`
	PublicKey  string `json:"public_key"`
	Timestamp  int64  `json:"timestamp"`
}

// HealthStatus represents the health status of the daemon
type HealthStatus struct {
	Status    string    `json:"status"`
	Uptime    int64     `json:"uptime"`
	Connected bool      `json:"connected"`
	LastCheck time.Time `json:"last_check"`
}

// ConnectionStatus represents the connection status to Headscale
type ConnectionStatus struct {
	Connected      bool      `json:"connected"`
	HeadscaleURL   string    `json:"headscale_url"`
	LastConnected  time.Time `json:"last_connected"`
	ReconnectCount int       `json:"reconnect_count"`
}
