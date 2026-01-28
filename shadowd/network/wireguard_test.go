package network

import (
	"testing"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewWireGuardManager(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	assert.NotNil(t, wg)
	assert.Equal(t, cfg.HeadscaleURL, wg.headscaleURL)
	assert.Equal(t, cfg.PreauthKey, wg.preauthKey)
	assert.Equal(t, cfg.DeviceName, wg.deviceName)
	assert.Equal(t, 30*time.Second, wg.heartbeatInterval)
	assert.Equal(t, 3, wg.maxReconnectAttempts)
	assert.Equal(t, 5*time.Second, wg.reconnectDelay)
}

func TestNewWireGuardManager_CustomSettings(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL:         "https://headscale.example.com",
		PreauthKey:           "test-key",
		DeviceName:           "test-device",
		HeartbeatInterval:    10 * time.Second,
		MaxReconnectAttempts: 5,
		ReconnectDelay:       2 * time.Second,
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	assert.Equal(t, 10*time.Second, wg.heartbeatInterval)
	assert.Equal(t, 5, wg.maxReconnectAttempts)
	assert.Equal(t, 2*time.Second, wg.reconnectDelay)
}

func TestWireGuardManager_InitialState(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	assert.False(t, wg.IsConnected())
	assert.Empty(t, wg.GetMeshIP())
	assert.Empty(t, wg.GetPublicKey())
}

func TestWireGuardManager_Start(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	err := wg.Start()
	require.NoError(t, err)
	
	// Verify connection state
	assert.True(t, wg.IsConnected())
	assert.NotEmpty(t, wg.GetMeshIP())
	assert.NotEmpty(t, wg.GetPublicKey())
	
	// Cleanup
	err = wg.Stop()
	require.NoError(t, err)
}

func TestWireGuardManager_Stop(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	err := wg.Start()
	require.NoError(t, err)
	assert.True(t, wg.IsConnected())
	
	err = wg.Stop()
	require.NoError(t, err)
	assert.False(t, wg.IsConnected())
}

func TestWireGuardManager_HealthCheck(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	// Health check should fail when not connected
	err := wg.HealthCheck()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not connected")
	
	// Start the manager
	err = wg.Start()
	require.NoError(t, err)
	
	// Health check should pass when connected
	err = wg.HealthCheck()
	assert.NoError(t, err)
	
	// Cleanup
	err = wg.Stop()
	require.NoError(t, err)
	
	// Health check should fail after stop
	err = wg.HealthCheck()
	assert.Error(t, err)
}

func TestWireGuardManager_GetStatus(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	err := wg.Start()
	require.NoError(t, err)
	defer wg.Stop()
	
	status := wg.GetStatus()
	
	assert.True(t, status["connected"].(bool))
	assert.NotEmpty(t, status["mesh_ip"])
	assert.NotEmpty(t, status["public_key"])
	assert.Equal(t, cfg.HeadscaleURL, status["headscale_url"])
	assert.Equal(t, cfg.DeviceName, status["device_name"])
	assert.Equal(t, 0, status["reconnect_attempts"])
}

func TestWireGuardManager_GenerateKeys(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	err := wg.generateKeys()
	require.NoError(t, err)
	
	assert.NotEmpty(t, wg.privateKey)
	assert.NotEmpty(t, wg.publicKey)
}

func TestWireGuardManager_RegisterWithHeadscale(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	// Generate keys first
	err := wg.generateKeys()
	require.NoError(t, err)
	
	// Register with Headscale
	err = wg.registerWithHeadscale()
	require.NoError(t, err)
	
	// Verify mesh IP was assigned
	assert.NotEmpty(t, wg.meshIP)
}

func TestWireGuardManager_SendHeartbeat(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL: "https://headscale.example.com",
		PreauthKey:   "test-key",
		DeviceName:   "test-device",
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	// Heartbeat should fail when not connected
	err := wg.sendHeartbeat()
	assert.Error(t, err)
	
	// Start the manager
	err = wg.Start()
	require.NoError(t, err)
	defer wg.Stop()
	
	// Record initial heartbeat time
	initialHeartbeat := wg.lastHeartbeat
	
	// Wait a bit
	time.Sleep(100 * time.Millisecond)
	
	// Send heartbeat
	err = wg.sendHeartbeat()
	assert.NoError(t, err)
	
	// Verify heartbeat time was updated
	assert.True(t, wg.lastHeartbeat.After(initialHeartbeat))
}

func TestWireGuardManager_CheckConnection(t *testing.T) {
	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)
	
	cfg := Config{
		HeadscaleURL:      "https://headscale.example.com",
		PreauthKey:        "test-key",
		DeviceName:        "test-device",
		HeartbeatInterval: 100 * time.Millisecond,
	}
	
	wg := NewWireGuardManager(cfg, log)
	
	// Check should fail when not connected
	err := wg.checkConnection()
	assert.Error(t, err)
	
	// Start the manager
	err = wg.Start()
	require.NoError(t, err)
	defer wg.Stop()
	
	// Check should pass immediately after start
	err = wg.checkConnection()
	assert.NoError(t, err)
	
	// Simulate stale heartbeat
	wg.mu.Lock()
	wg.lastHeartbeat = time.Now().Add(-1 * time.Second)
	wg.mu.Unlock()
	
	// Check should fail with stale heartbeat
	err = wg.checkConnection()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "heartbeat timeout")
}
