//go:build windows
// +build windows

package service

import (
	"fmt"
	"os/exec"
	"strings"
)

type windowsService struct {
	config Config
}

func newWindowsService(cfg Config) (Service, error) {
	return &windowsService{config: cfg}, nil
}

// Install installs the Windows service using sc.exe
func (s *windowsService) Install() error {
	// Build the command line with config path
	binPath := fmt.Sprintf(`"%s" -config "%s"`, s.config.ExecutablePath, s.config.ConfigPath)
	
	// Create the service using sc.exe
	cmd := exec.Command("sc.exe", "create", s.config.Name,
		"binPath=", binPath,
		"DisplayName=", s.config.DisplayName,
		"start=", "auto",
	)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to create service: %w, output: %s", err, string(output))
	}
	
	// Set service description
	descCmd := exec.Command("sc.exe", "description", s.config.Name, s.config.Description)
	if output, err := descCmd.CombinedOutput(); err != nil {
		// Non-fatal error, just log it
		fmt.Printf("Warning: failed to set service description: %v, output: %s\n", err, string(output))
	}
	
	fmt.Printf("Service '%s' installed successfully\n", s.config.Name)
	return nil
}

// Uninstall removes the Windows service
func (s *windowsService) Uninstall() error {
	// Stop the service first (ignore errors if already stopped)
	_ = s.Stop()
	
	// Delete the service
	cmd := exec.Command("sc.exe", "delete", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to delete service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' uninstalled successfully\n", s.config.Name)
	return nil
}

// Start starts the Windows service
func (s *windowsService) Start() error {
	cmd := exec.Command("sc.exe", "start", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Check if service is already running
		if strings.Contains(string(output), "already running") {
			return nil
		}
		return fmt.Errorf("failed to start service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' started successfully\n", s.config.Name)
	return nil
}

// Stop stops the Windows service
func (s *windowsService) Stop() error {
	cmd := exec.Command("sc.exe", "stop", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Check if service is already stopped
		if strings.Contains(string(output), "not started") {
			return nil
		}
		return fmt.Errorf("failed to stop service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' stopped successfully\n", s.config.Name)
	return nil
}

// Status returns the Windows service status
func (s *windowsService) Status() (string, error) {
	cmd := exec.Command("sc.exe", "query", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to query service status: %w, output: %s", err, string(output))
	}
	
	// Parse the output to extract status
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "STATE") {
			return strings.TrimSpace(line), nil
		}
	}
	
	return string(output), nil
}
