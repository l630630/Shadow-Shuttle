package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/shadow-shuttle/shadowd/service"
)

var (
	action         = flag.String("action", "", "Action to perform: install, uninstall, start, stop, status")
	executablePath = flag.String("executable", "", "Path to shadowd executable (default: auto-detect)")
	configPath     = flag.String("config", "/etc/shadowd/shadowd.yaml", "Path to configuration file")
	workingDir     = flag.String("workdir", "/var/lib/shadowd", "Working directory for the service")
	user           = flag.String("user", "root", "User to run the service as (Linux/macOS only)")
	group          = flag.String("group", "root", "Group to run the service as (Linux/macOS only)")
)

func main() {
	flag.Parse()

	if *action == "" {
		fmt.Println("Error: -action flag is required")
		flag.Usage()
		os.Exit(1)
	}

	// Auto-detect executable path if not provided
	if *executablePath == "" {
		exe, err := os.Executable()
		if err != nil {
			fmt.Printf("Error: failed to detect executable path: %v\n", err)
			os.Exit(1)
		}
		// Get the directory of the service command and look for shadowd
		dir := filepath.Dir(exe)
		*executablePath = filepath.Join(filepath.Dir(dir), "shadowd")
	}

	// Create service configuration
	cfg := service.Config{
		Name:             "shadowd",
		DisplayName:      "Shadow Shuttle Daemon",
		Description:      "Shadow Shuttle daemon for secure SSH access over Mesh network",
		ExecutablePath:   *executablePath,
		ConfigPath:       *configPath,
		WorkingDirectory: *workingDir,
		User:             *user,
		Group:            *group,
	}

	// Create service manager
	svc, err := service.NewService(cfg)
	if err != nil {
		fmt.Printf("Error: failed to create service manager: %v\n", err)
		os.Exit(1)
	}

	// Perform the requested action
	switch *action {
	case "install":
		if err := svc.Install(); err != nil {
			fmt.Printf("Error: failed to install service: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Service installed successfully")
		fmt.Println("Run 'shadowd-service -action start' to start the service")

	case "uninstall":
		if err := svc.Uninstall(); err != nil {
			fmt.Printf("Error: failed to uninstall service: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Service uninstalled successfully")

	case "start":
		if err := svc.Start(); err != nil {
			fmt.Printf("Error: failed to start service: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Service started successfully")

	case "stop":
		if err := svc.Stop(); err != nil {
			fmt.Printf("Error: failed to stop service: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Service stopped successfully")

	case "status":
		status, err := svc.Status()
		if err != nil {
			fmt.Printf("Error: failed to get service status: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Service status:")
		fmt.Println(status)

	default:
		fmt.Printf("Error: unknown action '%s'\n", *action)
		fmt.Println("Valid actions: install, uninstall, start, stop, status")
		os.Exit(1)
	}
}
