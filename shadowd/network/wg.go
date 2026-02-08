package network

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"
	"github.com/sirupsen/logrus"
)

type WireGuardManager struct {
	headscaleURL         string
	preauthKey           string
	deviceName           string
	meshIP               string
	publicKey            string
	privateKey           string
	connected            bool
	mu                   sync.RWMutex
	ctx                  context.Context
	cancel               context.CancelFunc
	log                  *logrus.Logger
	heartbeatInterval    time.Duration
	lastHeartbeat        time.Time
	reconnectAttempts    int
	maxReconnectAttempts int
	reconnectDelay       time.Duration
}

type Config struct {
	HeadscaleURL         string
	PreauthKey           string
	DeviceName           string
	HeartbeatInterval    time.Duration
	MaxReconnectAttempts int
	ReconnectDelay       time.Duration
}

func NewWireGuardManager(cfg Config, log *logrus.Logger) *WireGuardManager {
	ctx, cancel := context.WithCancel(context.Background())
	if cfg.HeartbeatInterval == 0 {
		cfg.HeartbeatInterval = 30 * time.Second
	}
	if cfg.MaxReconnectAttempts == 0 {
		cfg.MaxReconnectAttempts = 3
	}
	if cfg.ReconnectDelay == 0 {
		cfg.ReconnectDelay = 5 * time.Second
	}
	return &WireGuardManager{
		headscaleURL:         cfg.HeadscaleURL,
		preauthKey:           cfg.PreauthKey,
		deviceName:           cfg.DeviceName,
		ctx:                  ctx,
		cancel:               cancel,
		log:                  log,
		heartbeatInterval:    cfg.HeartbeatInterval,
		maxReconnectAttempts: cfg.MaxReconnectAttempts,
		reconnectDelay:       cfg.ReconnectDelay,
	}
}


func (wg *WireGuardManager) Start() error {
	wg.log.Info("Starting WireGuard manager")
	if err := wg.generateKeys(); err != nil {
		return fmt.Errorf("failed to generate keys: %w", err)
	}
	if err := wg.registerWithHeadscale(); err != nil {
		return fmt.Errorf("failed to register with Headscale: %w", err)
	}
	if err := wg.initializeInterface(); err != nil {
		return fmt.Errorf("failed to initialize WireGuard interface: %w", err)
	}
	wg.mu.Lock()
	wg.connected = true
	wg.lastHeartbeat = time.Now()
	wg.mu.Unlock()
	go wg.heartbeatLoop()
	go wg.connectionMonitor()
	wg.log.WithFields(logrus.Fields{"mesh_ip": wg.meshIP, "public_key": wg.publicKey[:16] + "..."}).Info("WireGuard manager started successfully")
	return nil
}

func (wg *WireGuardManager) Stop() error {
	wg.log.Info("Stopping WireGuard manager")
	wg.cancel()
	wg.mu.Lock()
	wg.connected = false
	wg.mu.Unlock()
	wg.log.Info("WireGuard manager stopped")
	return nil
}

func (wg *WireGuardManager) IsConnected() bool {
	wg.mu.RLock()
	defer wg.mu.RUnlock()
	return wg.connected
}

func (wg *WireGuardManager) GetMeshIP() string {
	wg.mu.RLock()
	defer wg.mu.RUnlock()
	return wg.meshIP
}

func (wg *WireGuardManager) GetPublicKey() string {
	wg.mu.RLock()
	defer wg.mu.RUnlock()
	return wg.publicKey
}

func (wg *WireGuardManager) generateKeys() error {
	wg.log.Debug("Generating WireGuard keys")
	wg.privateKey = "placeholder_private_key"
	wg.publicKey = "placeholder_public_key"
	return nil
}

func (wg *WireGuardManager) registerWithHeadscale() error {
	wg.log.WithFields(logrus.Fields{"headscale_url": wg.headscaleURL, "device_name": wg.deviceName}).Info("Registering with Headscale")
	// NOTE: Development stub implementation.
	// In real deployment this would call Headscale and obtain a real Mesh IP.
	// For local development, use the local network IP instead of 127.0.0.1
	// This allows mobile apps to connect via the local network
	
	localIP, err := GetPreferredLocalIP()
	if err != nil {
		wg.log.WithError(err).Warn("Failed to get local IP, falling back to 127.0.0.1")
		wg.meshIP = "127.0.0.1"
	} else {
		wg.meshIP = localIP
		wg.log.WithField("local_ip", localIP).Info("Using local network IP as Mesh IP (dev mode)")
	}
	
	wg.log.WithField("mesh_ip", wg.meshIP).Info("Successfully registered with Headscale (dev mode)")
	return nil
}

func (wg *WireGuardManager) initializeInterface() error {
	wg.log.Info("Initializing WireGuard interface")
	return nil
}

func (wg *WireGuardManager) heartbeatLoop() {
	ticker := time.NewTicker(wg.heartbeatInterval)
	defer ticker.Stop()
	for {
		select {
		case <-wg.ctx.Done():
			return
		case <-ticker.C:
			if err := wg.sendHeartbeat(); err != nil {
				wg.log.WithError(err).Warn("Failed to send heartbeat")
			}
		}
	}
}

func (wg *WireGuardManager) sendHeartbeat() error {
	wg.mu.Lock()
	defer wg.mu.Unlock()
	if !wg.connected {
		return fmt.Errorf("not connected")
	}
	wg.log.Debug("Sending heartbeat to Headscale")
	wg.lastHeartbeat = time.Now()
	return nil
}

func (wg *WireGuardManager) connectionMonitor() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-wg.ctx.Done():
			return
		case <-ticker.C:
			if err := wg.checkConnection(); err != nil {
				wg.log.WithError(err).Warn("Connection check failed, attempting reconnection")
				go wg.reconnect()
			}
		}
	}
}

func (wg *WireGuardManager) checkConnection() error {
	wg.mu.RLock()
	connected := wg.connected
	lastHeartbeat := wg.lastHeartbeat
	wg.mu.RUnlock()
	if !connected {
		return fmt.Errorf("not connected")
	}
	if time.Since(lastHeartbeat) > wg.heartbeatInterval*2 {
		return fmt.Errorf("heartbeat timeout")
	}
	return nil
}

func (wg *WireGuardManager) reconnect() {
	wg.mu.Lock()
	if wg.reconnectAttempts >= wg.maxReconnectAttempts {
		wg.mu.Unlock()
		wg.log.Error("Max reconnection attempts reached")
		return
	}
	wg.reconnectAttempts++
	attempt := wg.reconnectAttempts
	wg.mu.Unlock()
	wg.log.WithField("attempt", attempt).Info("Attempting to reconnect")
	time.Sleep(wg.reconnectDelay)
	wg.mu.Lock()
	wg.connected = false
	wg.mu.Unlock()
	if err := wg.registerWithHeadscale(); err != nil {
		wg.log.WithError(err).Error("Reconnection failed")
		return
	}
	if err := wg.initializeInterface(); err != nil {
		wg.log.WithError(err).Error("Failed to reinitialize interface")
		return
	}
	wg.mu.Lock()
	wg.connected = true
	wg.reconnectAttempts = 0
	wg.lastHeartbeat = time.Now()
	wg.mu.Unlock()
	wg.log.Info("Reconnection successful")
}

func (wg *WireGuardManager) HealthCheck() error {
	wg.mu.RLock()
	defer wg.mu.RUnlock()
	if !wg.connected {
		return fmt.Errorf("not connected to Headscale")
	}
	if wg.meshIP == "" {
		return fmt.Errorf("no mesh IP assigned")
	}
	if ip := net.ParseIP(wg.meshIP); ip == nil {
		return fmt.Errorf("invalid mesh IP: %s", wg.meshIP)
	}
	if time.Since(wg.lastHeartbeat) > wg.heartbeatInterval*3 {
		return fmt.Errorf("heartbeat stale")
	}
	return nil
}

func (wg *WireGuardManager) GetStatus() map[string]interface{} {
	wg.mu.RLock()
	defer wg.mu.RUnlock()
	return map[string]interface{}{
		"connected":          wg.connected,
		"mesh_ip":            wg.meshIP,
		"public_key":         wg.publicKey,
		"last_heartbeat":     wg.lastHeartbeat,
		"reconnect_attempts": wg.reconnectAttempts,
		"headscale_url":      wg.headscaleURL,
		"device_name":        wg.deviceName,
	}
}
