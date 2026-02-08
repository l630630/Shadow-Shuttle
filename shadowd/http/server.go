package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/shadow-shuttle/shadowd/grpc"
	"github.com/sirupsen/logrus"
)

// Config contains HTTP server configuration
type Config struct {
	ListenAddr string // e.g., "0.0.0.0:8080"
}

// Server represents the HTTP API server
type Server struct {
	config      Config
	log         *logrus.Logger
	server      *http.Server
	grpcServer  *grpc.Server
	ctx         context.Context
	cancel      context.CancelFunc
	wg          sync.WaitGroup
}

// DeviceInfoResponse represents device information response
type DeviceInfoResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	OS        string `json:"os"`
	OSVersion string `json:"osVersion"`
	MeshIP    string `json:"meshIP"`
	PublicKey string `json:"publicKey"`
	IsOnline  bool   `json:"isOnline"`
	LastSeen  int64  `json:"lastSeen"`
	SSHPort   int    `json:"sshPort"`
	GRPCPort  int    `json:"grpcPort"`
}

// PairingCodeResponse represents pairing code response
type PairingCodeResponse struct {
	DeviceID   string `json:"deviceId"`
	DeviceName string `json:"deviceName"`
	MeshIP     string `json:"meshIp"`
	PublicKey  string `json:"publicKey"`
	Timestamp  int64  `json:"timestamp"`
	QRCode     string `json:"qrCode"` // Base64 encoded QR code image
}

// HealthStatusResponse represents health status response
type HealthStatusResponse struct {
	Status    string `json:"status"`
	Uptime    int64  `json:"uptime"`
	Connected bool   `json:"connected"`
	LastCheck int64  `json:"lastCheck"`
}

// ErrorResponse represents error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// NewServer creates a new HTTP API server
func NewServer(config Config, grpcServer *grpc.Server, log *logrus.Logger) *Server {
	if log == nil {
		log = logrus.New()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Server{
		config:     config,
		log:        log,
		grpcServer: grpcServer,
		ctx:        ctx,
		cancel:     cancel,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/device/info", s.handleGetDeviceInfo)
	mux.HandleFunc("/api/device/pairing-code", s.handleGeneratePairingCode)
	mux.HandleFunc("/api/health", s.handleHealthCheck)

	// CORS middleware
	handler := s.corsMiddleware(mux)

	s.server = &http.Server{
		Addr:    s.config.ListenAddr,
		Handler: handler,
	}

	s.wg.Add(1)
	go func() {
		defer s.wg.Done()

		s.log.WithField("address", s.config.ListenAddr).Info("HTTP API server listening")

		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.log.WithError(err).Error("HTTP server error")
		}
	}()

	return nil
}

// Stop stops the HTTP server
func (s *Server) Stop() error {
	s.log.Info("Stopping HTTP API server")

	s.cancel()

	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := s.server.Shutdown(ctx); err != nil {
			s.log.WithError(err).Warn("Error shutting down HTTP server")
		}
	}

	s.wg.Wait()

	s.log.Info("HTTP API server stopped")
	return nil
}

// handleGetDeviceInfo handles GET /api/device/info
func (s *Server) handleGetDeviceInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.sendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get device info from gRPC server
	deviceInfo, err := s.grpcServer.GetDeviceInfo(s.ctx, &grpc.Empty{})
	if err != nil {
		s.log.WithError(err).Error("Failed to get device info")
		s.sendError(w, http.StatusInternalServerError, "Failed to get device info")
		return
	}

	response := DeviceInfoResponse{
		ID:        deviceInfo.Id,
		Name:      deviceInfo.Name,
		OS:        deviceInfo.Os,
		OSVersion: deviceInfo.OsVersion,
		MeshIP:    deviceInfo.MeshIp,
		PublicKey: deviceInfo.PublicKey,
		IsOnline:  deviceInfo.IsOnline,
		LastSeen:  deviceInfo.LastSeen,
		SSHPort:   int(deviceInfo.SshPort),
		GRPCPort:  int(deviceInfo.GrpcPort),
	}

	s.sendJSON(w, http.StatusOK, response)
}

// handleGeneratePairingCode handles GET /api/device/pairing-code
func (s *Server) handleGeneratePairingCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.sendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Generate pairing code from gRPC server
	pairingCode, err := s.grpcServer.GeneratePairingCode(s.ctx, &grpc.Empty{})
	if err != nil {
		s.log.WithError(err).Error("Failed to generate pairing code")
		s.sendError(w, http.StatusInternalServerError, "Failed to generate pairing code")
		return
	}

	// Generate QR code (simplified - in production, use a QR code library)
	qrCodeData := fmt.Sprintf("%s|%s|%s|%s",
		pairingCode.DeviceId,
		pairingCode.DeviceName,
		pairingCode.MeshIp,
		pairingCode.PublicKey,
	)

	response := PairingCodeResponse{
		DeviceID:   pairingCode.DeviceId,
		DeviceName: pairingCode.DeviceName,
		MeshIP:     pairingCode.MeshIp,
		PublicKey:  pairingCode.PublicKey,
		Timestamp:  pairingCode.Timestamp,
		QRCode:     qrCodeData, // In production, generate actual QR code image
	}

	s.sendJSON(w, http.StatusOK, response)
}

// handleHealthCheck handles GET /api/health
func (s *Server) handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.sendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get health status from gRPC server
	health, err := s.grpcServer.HealthCheck(s.ctx, &grpc.Empty{})
	if err != nil {
		s.log.WithError(err).Error("Failed to get health status")
		s.sendError(w, http.StatusInternalServerError, "Failed to get health status")
		return
	}

	response := HealthStatusResponse{
		Status:    health.Status,
		Uptime:    health.Uptime,
		Connected: health.Connected,
		LastCheck: health.LastCheck,
	}

	s.sendJSON(w, http.StatusOK, response)
}

// corsMiddleware adds CORS headers
func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow all origins for development
		// In production, restrict to specific origins
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// sendJSON sends a JSON response
func (s *Server) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		s.log.WithError(err).Error("Failed to encode JSON response")
	}
}

// sendError sends an error response
func (s *Server) sendError(w http.ResponseWriter, status int, message string) {
	response := ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	}
	s.sendJSON(w, status, response)
}
