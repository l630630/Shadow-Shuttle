package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/shadow-shuttle/shadowd/config"
	"github.com/shadow-shuttle/shadowd/grpc"
	"github.com/shadow-shuttle/shadowd/http"
	"github.com/shadow-shuttle/shadowd/network"
	"github.com/shadow-shuttle/shadowd/ssh"
	"github.com/shadow-shuttle/shadowd/websocket"
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

	// Initialize WebSocket SSH proxy
	wsServer := initializeWebSocket(cfg, log)
	if wsServer == nil {
		log.Fatal("Failed to initialize WebSocket server")
	}
	defer wsServer.Stop()

	// Initialize HTTP API server
	httpServer := initializeHTTP(grpcServer, log)
	if httpServer == nil {
		log.Fatal("Failed to initialize HTTP server")
	}
	defer httpServer.Stop()

	// Initialize mDNS service advertisement
	mdnsService := initializeMDNS(cfg, meshIP, log)
	if mdnsService != nil {
		defer mdnsService.Stop()
	}

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
	meshIP := wgManager.GetMeshIP()
	
	if meshIP == "" {
		log.Warn("Mesh IP not yet assigned, using local network IP")
		// In development, use the local network IP instead of a placeholder
		localIP, err := network.GetPreferredLocalIP()
		if err != nil {
			log.WithError(err).Warn("Failed to get local IP, using fallback")
			meshIP = "127.0.0.1"
		} else {
			meshIP = localIP
			log.WithField("local_ip", localIP).Info("Using local network IP as Mesh IP")
		}
	}
	
	log.WithField("mesh_ip", meshIP).Info("Obtained Mesh IP address")
	return meshIP
}

// initializeSSH initializes and starts the SSH server
func initializeSSH(cfg *config.Config, meshIP string, log *logrus.Logger) *ssh.Server {
	// Add localhost to allowed networks for WebSocket proxy
	allowedNetworks := append(cfg.SSH.AllowedNetworks, "127.0.0.1/32")
	
	sshConfig := ssh.Config{
		MeshIP:             "127.0.0.1", // Listen on localhost for WebSocket proxy
		Port:               cfg.SSH.Port,
		HostKeyPath:        cfg.SSH.HostKeyPath,
		AuthorizedKeysPath: cfg.SSH.AuthorizedKeysPath,
		AllowedNetworks:    allowedNetworks,
		Users:              cfg.SSH.Users,
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

// initializeWebSocket initializes and starts the WebSocket SSH proxy
func initializeWebSocket(cfg *config.Config, log *logrus.Logger) *websocket.Server {
	wsConfig := websocket.Config{
		ListenAddr: "0.0.0.0:8022", // Listen on all interfaces
		SSHHost:    "127.0.0.1",    // Use IPv4 localhost
		SSHPort:    cfg.SSH.Port,   // Connect to shadowd SSH server
	}

	wsServer := websocket.NewServer(wsConfig, log)

	if err := wsServer.Start(); err != nil {
		log.WithError(err).Error("Failed to start WebSocket server")
		return nil
	}

	return wsServer
}

// initializeHTTP initializes and starts the HTTP API server
func initializeHTTP(grpcServer *grpc.Server, log *logrus.Logger) *http.Server {
	httpConfig := http.Config{
		ListenAddr: "0.0.0.0:8080", // HTTP API on port 8080
	}

	httpServer := http.NewServer(httpConfig, grpcServer, log)

	if err := httpServer.Start(); err != nil {
		log.WithError(err).Error("Failed to start HTTP server")
		return nil
	}

	return httpServer
}

// initializeMDNS initializes and starts the mDNS service advertisement
func initializeMDNS(cfg *config.Config, meshIP string, log *logrus.Logger) *network.MDNSService {
	mdnsConfig := network.MDNSConfig{
		ServiceName: cfg.Device.Name,
		ServiceType: "_shadowd._tcp",
		Domain:      "local.",
		Port:        8080, // HTTP API port
		TXTRecords: []string{
			"version=0.1.0",
			fmt.Sprintf("mesh_ip=%s", meshIP),
			fmt.Sprintf("ssh_port=%d", cfg.SSH.Port),
			fmt.Sprintf("grpc_port=%d", cfg.GRPC.Port),
			"ws_port=8022",
		},
	}

	mdnsService, err := network.NewMDNSService(mdnsConfig, log)
	if err != nil {
		log.WithError(err).Warn("Failed to create mDNS service (non-fatal)")
		return nil
	}

	if err := mdnsService.Start(mdnsConfig); err != nil {
		log.WithError(err).Warn("Failed to start mDNS service (non-fatal)")
		return nil
	}

	return mdnsService
}
