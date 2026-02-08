package network

import (
	"context"
	"fmt"
	"time"

	"github.com/grandcat/zeroconf"
	"github.com/sirupsen/logrus"
)

// MDNSService manages mDNS/Bonjour service advertisement
type MDNSService struct {
	server      *zeroconf.Server
	log         *logrus.Logger
	ctx         context.Context
	cancel      context.CancelFunc
	serviceName string
	port        int
}

// MDNSConfig contains mDNS service configuration
type MDNSConfig struct {
	ServiceName string   // Instance name (e.g., "MacBook Air")
	ServiceType string   // Service type (e.g., "_shadowd._tcp")
	Domain      string   // Domain (usually "local.")
	Port        int      // Service port
	TXTRecords  []string // Additional TXT records
}

// NewMDNSService creates a new mDNS service
func NewMDNSService(config MDNSConfig, log *logrus.Logger) (*MDNSService, error) {
	if log == nil {
		log = logrus.New()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &MDNSService{
		log:         log,
		ctx:         ctx,
		cancel:      cancel,
		serviceName: config.ServiceName,
		port:        config.Port,
	}, nil
}

// Start starts advertising the mDNS service
func (m *MDNSService) Start(config MDNSConfig) error {
	m.log.WithFields(logrus.Fields{
		"service_name": config.ServiceName,
		"service_type": config.ServiceType,
		"port":         config.Port,
	}).Info("Starting mDNS service advertisement")

	// Register the service
	server, err := zeroconf.Register(
		config.ServiceName, // Instance name
		config.ServiceType, // Service type
		config.Domain,      // Domain
		config.Port,        // Port
		config.TXTRecords,  // TXT records
		nil,                // Network interfaces (nil = all)
	)
	if err != nil {
		return fmt.Errorf("failed to register mDNS service: %w", err)
	}

	m.server = server

	m.log.WithFields(logrus.Fields{
		"service_name": config.ServiceName,
		"service_type": config.ServiceType,
		"port":         config.Port,
	}).Info("mDNS service advertisement started")

	return nil
}

// Stop stops the mDNS service advertisement
func (m *MDNSService) Stop() error {
	m.log.Info("Stopping mDNS service advertisement")

	m.cancel()

	if m.server != nil {
		m.server.Shutdown()
		// Give it a moment to clean up
		time.Sleep(100 * time.Millisecond)
	}

	m.log.Info("mDNS service advertisement stopped")
	return nil
}

// UpdateTXTRecords updates the TXT records for the service
func (m *MDNSService) UpdateTXTRecords(records []string) error {
	// Note: zeroconf doesn't support updating TXT records dynamically
	// Would need to stop and restart the service
	m.log.Warn("Updating TXT records requires service restart")
	return nil
}
