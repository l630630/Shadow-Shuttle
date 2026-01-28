//go:build linux
// +build linux

package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"
)

type linuxService struct {
	config Config
}

func newLinuxService(cfg Config) (Service, error) {
	return &linuxService{config: cfg}, nil
}

// unitFilePath returns the path to the systemd unit file
func (s *linuxService) unitFilePath() string {
	return filepath.Join("/etc/systemd/system", fmt.Sprintf("%s.service", s.config.Name))
}

// Install installs the Linux systemd service
func (s *linuxService) Install() error {
	// Create the unit file
	unitContent, err := s.generateUnitFile()
	if err != nil {
		return fmt.Errorf("failed to generate unit file: %w", err)
	}
	
	unitPath := s.unitFilePath()
	
	// Write the unit file
	if err := os.WriteFile(unitPath, []byte(unitContent), 0644); err != nil {
		return fmt.Errorf("failed to write unit file: %w", err)
	}
	
	// Reload systemd daemon
	cmd := exec.Command("systemctl", "daemon-reload")
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to reload systemd: %w, output: %s", err, string(output))
	}
	
	// Enable the service to start on boot
	cmd = exec.Command("systemctl", "enable", s.config.Name)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to enable service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' installed successfully at %s\n", s.config.Name, unitPath)
	return nil
}

// Uninstall removes the Linux systemd service
func (s *linuxService) Uninstall() error {
	// Stop the service (ignore errors if not running)
	_ = s.Stop()
	
	// Disable the service
	cmd := exec.Command("systemctl", "disable", s.config.Name)
	_ = cmd.Run()
	
	// Remove the unit file
	unitPath := s.unitFilePath()
	if err := os.Remove(unitPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove unit file: %w", err)
	}
	
	// Reload systemd daemon
	cmd = exec.Command("systemctl", "daemon-reload")
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to reload systemd: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' uninstalled successfully\n", s.config.Name)
	return nil
}

// Start starts the Linux systemd service
func (s *linuxService) Start() error {
	cmd := exec.Command("systemctl", "start", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to start service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' started successfully\n", s.config.Name)
	return nil
}

// Stop stops the Linux systemd service
func (s *linuxService) Stop() error {
	cmd := exec.Command("systemctl", "stop", s.config.Name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to stop service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' stopped successfully\n", s.config.Name)
	return nil
}

// Status returns the Linux systemd service status
func (s *linuxService) Status() (string, error) {
	cmd := exec.Command("systemctl", "status", s.config.Name)
	output, err := cmd.CombinedOutput()
	
	// systemctl status returns non-zero exit code if service is not running
	// but we still want to return the output
	return string(output), err
}

// generateUnitFile generates the systemd unit file content
func (s *linuxService) generateUnitFile() (string, error) {
	const unitTemplate = `[Unit]
Description={{.Description}}
After=network.target

[Service]
Type=simple
User={{.User}}
Group={{.Group}}
WorkingDirectory={{.WorkingDirectory}}
ExecStart={{.ExecutablePath}} -config {{.ConfigPath}}
Restart=on-failure
RestartSec=5s

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths={{.WorkingDirectory}}

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier={{.Name}}

[Install]
WantedBy=multi-user.target
`
	
	tmpl, err := template.New("unit").Parse(unitTemplate)
	if err != nil {
		return "", err
	}
	
	var result strings.Builder
	if err := tmpl.Execute(&result, s.config); err != nil {
		return "", err
	}
	
	return result.String(), nil
}
