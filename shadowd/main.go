package main

import (
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/shadow-shuttle/shadowd/config"
	"github.com/shadow-shuttle/shadowd/grpc"
	"github.com/shadow-shuttle/shadowd/network"
	"github.com/shadow-shuttle/shadowd/ssh"
	"github.com/sirupsen/logrus"
)

var (
	configPath = flag.String("config", "shadowd.yaml", "Path to configuration file")
	version    = "0.1.0"
)

func main() {
	flag.Parse()

	// Initialize logger
	log := logrus.New()
	log.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})
	log.SetLevel(logrus.InfoLevel)

	log.WithField("version", version).Info("Starting Shadowd")

	// Load configuration
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.WithError(err).Fatal("Failed to load configuration")
	}

	log.WithFields(logrus.Fields{
		"device_name":    cfg.Device.Name,
		"headscale_url":  cfg.Headscale.URL,
		"ssh_port":       cfg.SSH.Port,
		"grpc_port":      cfg.GRPC.Port,
	}).Info("Configuration loaded")

	// Initialize WireGuard connection
	wgManager := initializeWireGuard(cfg, log)
	if wgManager == nil {
		log.Fatal("Failed to initialize WireGuard manager")
	}
	defer wgManager.Stop()

	// Wait for WireGuard to be connected and get Mesh IP
	meshIP := waitForMeshIP(wgManager, log)
	if meshIP == "" {
		log.Fatal("Failed to obtain Mesh IP address")
	}

	// Check if demo mode is enabled (use localhost instead of Mesh IP)
	if cfg.DemoMode != nil && cfg.DemoMode.UseLocalhost {
		log.Warn("Demo mode enabled: using localhost instead of Mesh IP")
		meshIP = "127.0.0.1"
	}

	// Initialize SSH server
	sshServer := initializeSSH(cfg, meshIP, log)
	if sshServer == nil {
		log.Fatal("Failed to initialize SSH server")
	}
	defer sshServer.Stop()

	// Initialize gRPC server
	grpcServer := initializeGRPC(cfg, meshIP, log)
	if grpcServer == nil {
		log.Fatal("Failed to initialize gRPC server")
	}
	defer grpcServer.Stop()

	log.Info("Shadowd started successfully")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Info("Shutting down Shadowd")
	// Cleanup is handled by defer statements
}

// initializeWireGuard initializes and starts the WireGuard manager
func initializeWireGuard(cfg *config.Config, log *logrus.Logger) *network.WireGuardManager {
	wgConfig := network.Config{
		HeadscaleURL: cfg.Headscale.URL,
		PreauthKey:   cfg.Headscale.PreauthKey,
		DeviceName:   cfg.Device.Name,
	}

	wgManager := network.NewWireGuardManager(wgConfig, log)

	if err := wgManager.Start(); err != nil {
		log.WithError(err).Error("Failed to start WireGuard manager")
		return nil
	}

	return wgManager
}

// waitForMeshIP waits for WireGuard to connect and returns the Mesh IP
func waitForMeshIP(wgManager *network.WireGuardManager, log *logrus.Logger) string {
	// In a real implementation, we would wait for the connection to be established
	// For now, we'll just get the IP immediately
	meshIP := wgManager.GetMeshIP()
	
	if meshIP == "" {
		log.Warn("Mesh IP not yet assigned, using placeholder")
		// In development, use a placeholder IP
		meshIP = "100.64.0.1"
	}
	
	log.WithField("mesh_ip", meshIP).Info("Obtained Mesh IP address")
	return meshIP
}

// initializeSSH initializes and starts the SSH server
func initializeSSH(cfg *config.Config, meshIP string, log *logrus.Logger) *ssh.Server {
	sshConfig := ssh.Config{
		MeshIP:             meshIP,
		Port:               cfg.SSH.Port,
		HostKeyPath:        cfg.SSH.HostKeyPath,
		AuthorizedKeysPath: cfg.SSH.AuthorizedKeysPath,
		AllowedNetworks:    cfg.SSH.AllowedNetworks,
	}

	sshServer, err := ssh.NewServer(sshConfig, log)
	if err != nil {
		log.WithError(err).Error("Failed to create SSH server")
		return nil
	}

	if err := sshServer.Start(); err != nil {
		log.WithError(err).Error("Failed to start SSH server")
		return nil
	}

	return sshServer
}

// initializeGRPC initializes and starts the gRPC server
func initializeGRPC(cfg *config.Config, meshIP string, log *logrus.Logger) *grpc.Server {
	// Collect device information
	deviceInfo := grpc.GetDeviceInfoFromSystem(meshIP, cfg.SSH.Port, cfg.GRPC.Port)
	
	grpcConfig := grpc.Config{
		MeshIP:     meshIP,
		Port:       cfg.GRPC.Port,
		TLSEnabled: cfg.GRPC.TLSEnabled,
	}

	grpcServer, err := grpc.NewServer(grpcConfig, deviceInfo, log)
	if err != nil {
		log.WithError(err).Error("Failed to create gRPC server")
		return nil
	}

	if err := grpcServer.Start(); err != nil {
		log.WithError(err).Error("Failed to start gRPC server")
		return nil
	}

	return grpcServer
}
