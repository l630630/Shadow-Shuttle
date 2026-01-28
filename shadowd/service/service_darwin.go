//go:build darwin
// +build darwin

package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"
)

type darwinService struct {
	config Config
}

func newDarwinService(cfg Config) (Service, error) {
	return &darwinService{config: cfg}, nil
}

// plistPath returns the path to the launchd plist file
func (s *darwinService) plistPath() string {
	return filepath.Join("/Library/LaunchDaemons", fmt.Sprintf("com.shadowshuttle.%s.plist", s.config.Name))
}

// Install installs the macOS launchd service
func (s *darwinService) Install() error {
	// Create the plist file
	plistContent, err := s.generatePlist()
	if err != nil {
		return fmt.Errorf("failed to generate plist: %w", err)
	}
	
	plistPath := s.plistPath()
	
	// Write the plist file
	if err := os.WriteFile(plistPath, []byte(plistContent), 0644); err != nil {
		return fmt.Errorf("failed to write plist file: %w", err)
	}
	
	// Load the service
	cmd := exec.Command("launchctl", "load", plistPath)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to load service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' installed successfully at %s\n", s.config.Name, plistPath)
	return nil
}

// Uninstall removes the macOS launchd service
func (s *darwinService) Uninstall() error {
	plistPath := s.plistPath()
	
	// Unload the service (ignore errors if not loaded)
	cmd := exec.Command("launchctl", "unload", plistPath)
	_ = cmd.Run()
	
	// Remove the plist file
	if err := os.Remove(plistPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove plist file: %w", err)
	}
	
	fmt.Printf("Service '%s' uninstalled successfully\n", s.config.Name)
	return nil
}

// Start starts the macOS launchd service
func (s *darwinService) Start() error {
	cmd := exec.Command("launchctl", "start", fmt.Sprintf("com.shadowshuttle.%s", s.config.Name))
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to start service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' started successfully\n", s.config.Name)
	return nil
}

// Stop stops the macOS launchd service
func (s *darwinService) Stop() error {
	cmd := exec.Command("launchctl", "stop", fmt.Sprintf("com.shadowshuttle.%s", s.config.Name))
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to stop service: %w, output: %s", err, string(output))
	}
	
	fmt.Printf("Service '%s' stopped successfully\n", s.config.Name)
	return nil
}

// Status returns the macOS launchd service status
func (s *darwinService) Status() (string, error) {
	cmd := exec.Command("launchctl", "list", fmt.Sprintf("com.shadowshuttle.%s", s.config.Name))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("service not found or not running")
	}
	
	return string(output), nil
}

// generatePlist generates the launchd plist content
func (s *darwinService) generatePlist() (string, error) {
	const plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shadowshuttle.{{.Name}}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>{{.ExecutablePath}}</string>
        <string>-config</string>
        <string>{{.ConfigPath}}</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>WorkingDirectory</key>
    <string>{{.WorkingDirectory}}</string>
    
    <key>StandardOutPath</key>
    <string>/var/log/shadowd.log</string>
    
    <key>StandardErrorPath</key>
    <string>/var/log/shadowd.error.log</string>
    
    <key>UserName</key>
    <string>{{.User}}</string>
    
    <key>GroupName</key>
    <string>{{.Group}}</string>
</dict>
</plist>
`
	
	tmpl, err := template.New("plist").Parse(plistTemplate)
	if err != nil {
		return "", err
	}
	
	var result strings.Builder
	if err := tmpl.Execute(&result, s.config); err != nil {
		return "", err
	}
	
	return result.String(), nil
}
