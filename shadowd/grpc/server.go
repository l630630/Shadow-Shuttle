package grpc

import (
	"context"
	"fmt"
	"net"
	"os"
	"runtime"
	"time"

	"github.com/shadow-shuttle/shadowd/types"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

// Config contains gRPC server configuration
type Config struct {
	MeshIP     string
	Port       int
	TLSEnabled bool
}

// Server represents the gRPC server
type Server struct {
	config     Config
	log        *logrus.Logger
	grpcServer *grpc.Server
	listener   net.Listener
	startTime  time.Time
	deviceInfo *types.Device
}

// deviceServiceImpl implements the DeviceService gRPC interface
type deviceServiceImpl struct {
	server *Server
}

// NewServer creates a new gRPC server instance
func NewServer(config Config, deviceInfo *types.Device, log *logrus.Logger) (*Server, error) {
	if log == nil {
		log = logrus.New()
	}

	server := &Server{
		config:     config,
		log:        log,
		startTime:  time.Now(),
		deviceInfo: deviceInfo,
	}

	return server, nil
}

// Start starts the gRPC server
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.config.MeshIP, s.config.Port)
	
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", addr, err)
	}
	s.listener = listener

	// Create gRPC server
	var opts []grpc.ServerOption
	// TODO: Add TLS support if enabled
	
	s.grpcServer = grpc.NewServer(opts...)
	
	// Register DeviceService
	deviceService := &deviceServiceImpl{server: s}
	RegisterDeviceServiceServer(s.grpcServer, deviceService)

	s.log.WithField("address", addr).Info("Starting gRPC server")

	// Start serving in a goroutine
	go func() {
		if err := s.grpcServer.Serve(listener); err != nil {
			s.log.WithError(err).Error("gRPC server error")
		}
	}()

	return nil
}

// Stop stops the gRPC server
func (s *Server) Stop() error {
	s.log.Info("Stopping gRPC server")
	
	if s.grpcServer != nil {
		s.grpcServer.GracefulStop()
	}
	
	if s.listener != nil {
		s.listener.Close()
	}
	
	return nil
}

// GetDeviceInfo returns information about this device
func (d *deviceServiceImpl) GetDeviceInfo(ctx context.Context, req *Empty) (*DeviceInfo, error) {
	d.server.log.Debug("GetDeviceInfo called")
	
	device := d.server.deviceInfo
	
	return &DeviceInfo{
		Id:        device.ID,
		Name:      device.Name,
		Os:        device.OS,
		OsVersion: device.OSVersion,
		MeshIp:    device.MeshIP,
		PublicKey: device.PublicKey,
		IsOnline:  device.IsOnline,
		LastSeen:  device.LastSeen.Unix(),
		SshPort:   int32(device.SSHPort),
		GrpcPort:  int32(device.GRPCPort),
	}, nil
}

// GeneratePairingCode generates a pairing code for QR code scanning
func (d *deviceServiceImpl) GeneratePairingCode(ctx context.Context, req *Empty) (*PairingCode, error) {
	d.server.log.Debug("GeneratePairingCode called")
	
	device := d.server.deviceInfo
	
	return &PairingCode{
		DeviceId:   device.ID,
		DeviceName: device.Name,
		MeshIp:     device.MeshIP,
		PublicKey:  device.PublicKey,
		Timestamp:  time.Now().Unix(),
	}, nil
}

// HealthCheck returns the health status of the daemon
func (d *deviceServiceImpl) HealthCheck(ctx context.Context, req *Empty) (*HealthStatus, error) {
	d.server.log.Debug("HealthCheck called")
	
	uptime := time.Since(d.server.startTime).Seconds()
	
	// Determine health status
	status := "healthy"
	connected := d.server.deviceInfo.IsOnline
	
	if !connected {
		status = "degraded"
	}
	
	return &HealthStatus{
		Status:    status,
		Uptime:    int64(uptime),
		Connected: connected,
		LastCheck: time.Now().Unix(),
	}, nil
}

// GetDeviceInfoFromSystem collects device information from the system
func GetDeviceInfoFromSystem(meshIP string, sshPort, grpcPort int) *types.Device {
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "unknown"
	}
	
	return &types.Device{
		ID:        generateDeviceID(hostname),
		Name:      hostname,
		OS:        runtime.GOOS,
		OSVersion: getOSVersion(),
		MeshIP:    meshIP,
		PublicKey: "", // Will be set by WireGuard manager
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   sshPort,
		GRPCPort:  grpcPort,
	}
}

// generateDeviceID generates a unique device ID based on hostname and timestamp
func generateDeviceID(hostname string) string {
	return fmt.Sprintf("%s-%d", hostname, time.Now().Unix())
}

// getOSVersion returns the OS version string
func getOSVersion() string {
	// This is a simplified version
	// In production, you would use platform-specific APIs
	switch runtime.GOOS {
	case "darwin":
		return "macOS"
	case "linux":
		return "Linux"
	case "windows":
		return "Windows"
	default:
		return "Unknown"
	}
}
