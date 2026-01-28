package service

import (
	"fmt"
	"runtime"
)

// Service represents a system service manager
type Service interface {
	// Install installs the service
	Install() error
	
	// Uninstall removes the service
	Uninstall() error
	
	// Start starts the service
	Start() error
	
	// Stop stops the service
	Stop() error
	
	// Status returns the service status
	Status() (string, error)
}

// Config holds service configuration
type Config struct {
	// Name is the service name
	Name string
	
	// DisplayName is the human-readable service name
	DisplayName string
	
	// Description is the service description
	Description string
	
	// ExecutablePath is the path to the shadowd binary
	ExecutablePath string
	
	// ConfigPath is the path to the configuration file
	ConfigPath string
	
	// WorkingDirectory is the working directory for the service
	WorkingDirectory string
	
	// User is the user to run the service as (Linux/macOS only)
	User string
	
	// Group is the group to run the service as (Linux/macOS only)
	Group string
}

// NewService creates a new service manager for the current platform
func NewService(cfg Config) (Service, error) {
	switch runtime.GOOS {
	case "windows":
		return newWindowsService(cfg)
	case "darwin":
		return newDarwinService(cfg)
	case "linux":
		return newLinuxService(cfg)
	default:
		return nil, fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

// DefaultConfig returns a default service configuration
func DefaultConfig() Config {
	return Config{
		Name:             "shadowd",
		DisplayName:      "Shadow Shuttle Daemon",
		Description:      "Shadow Shuttle daemon for secure SSH access over Mesh network",
		ExecutablePath:   "/usr/local/bin/shadowd",
		ConfigPath:       "/etc/shadowd/shadowd.yaml",
		WorkingDirectory: "/var/lib/shadowd",
		User:             "root",
		Group:            "root",
	}
}
