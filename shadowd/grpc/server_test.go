package grpc

import (
	"context"
	"testing"
	"time"

	"github.com/shadow-shuttle/shadowd/types"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewServer tests the creation of a new gRPC server
func TestNewServer(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel) // Reduce noise in tests

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)
	require.NotNil(t, server)

	assert.Equal(t, config.MeshIP, server.config.MeshIP)
	assert.Equal(t, config.Port, server.config.Port)
	assert.Equal(t, deviceInfo, server.deviceInfo)
}

// TestGetDeviceInfo tests the GetDeviceInfo RPC method
func TestGetDeviceInfo(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	service := &deviceServiceImpl{server: server}

	ctx := context.Background()
	resp, err := service.GetDeviceInfo(ctx, &Empty{})
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.Equal(t, deviceInfo.ID, resp.Id)
	assert.Equal(t, deviceInfo.Name, resp.Name)
	assert.Equal(t, deviceInfo.OS, resp.Os)
	assert.Equal(t, deviceInfo.OSVersion, resp.OsVersion)
	assert.Equal(t, deviceInfo.MeshIP, resp.MeshIp)
	assert.Equal(t, deviceInfo.PublicKey, resp.PublicKey)
	assert.Equal(t, deviceInfo.IsOnline, resp.IsOnline)
	assert.Equal(t, int32(deviceInfo.SSHPort), resp.SshPort)
	assert.Equal(t, int32(deviceInfo.GRPCPort), resp.GrpcPort)
}

// TestGeneratePairingCode tests the GeneratePairingCode RPC method
func TestGeneratePairingCode(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	service := &deviceServiceImpl{server: server}

	ctx := context.Background()
	resp, err := service.GeneratePairingCode(ctx, &Empty{})
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.Equal(t, deviceInfo.ID, resp.DeviceId)
	assert.Equal(t, deviceInfo.Name, resp.DeviceName)
	assert.Equal(t, deviceInfo.MeshIP, resp.MeshIp)
	assert.Equal(t, deviceInfo.PublicKey, resp.PublicKey)
	assert.Greater(t, resp.Timestamp, int64(0))
	
	// Verify timestamp is recent (within last 5 seconds)
	now := time.Now().Unix()
	assert.InDelta(t, now, resp.Timestamp, 5)
}

// TestHealthCheck tests the HealthCheck RPC method
func TestHealthCheck(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	service := &deviceServiceImpl{server: server}

	// Wait a bit to have some uptime
	time.Sleep(100 * time.Millisecond)

	ctx := context.Background()
	resp, err := service.HealthCheck(ctx, &Empty{})
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.Equal(t, "healthy", resp.Status)
	assert.Greater(t, resp.Uptime, int64(0))
	assert.True(t, resp.Connected)
	assert.Greater(t, resp.LastCheck, int64(0))
}

// TestHealthCheckDegraded tests health check when device is offline
func TestHealthCheckDegraded(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  false, // Device is offline
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	service := &deviceServiceImpl{server: server}

	ctx := context.Background()
	resp, err := service.HealthCheck(ctx, &Empty{})
	require.NoError(t, err)
	require.NotNil(t, resp)

	assert.Equal(t, "degraded", resp.Status)
	assert.False(t, resp.Connected)
}

// TestGetDeviceInfoFromSystem tests device info collection from system
func TestGetDeviceInfoFromSystem(t *testing.T) {
	meshIP := "100.64.0.1"
	sshPort := 22
	grpcPort := 50051

	device := GetDeviceInfoFromSystem(meshIP, sshPort, grpcPort)
	require.NotNil(t, device)

	assert.NotEmpty(t, device.ID)
	assert.NotEmpty(t, device.Name)
	assert.NotEmpty(t, device.OS)
	assert.NotEmpty(t, device.OSVersion)
	assert.Equal(t, meshIP, device.MeshIP)
	assert.Equal(t, sshPort, device.SSHPort)
	assert.Equal(t, grpcPort, device.GRPCPort)
	assert.True(t, device.IsOnline)
}

// TestGenerateDeviceID tests device ID generation
func TestGenerateDeviceID(t *testing.T) {
	hostname := "test-host"
	
	id1 := generateDeviceID(hostname)
	assert.NotEmpty(t, id1)
	assert.Contains(t, id1, hostname)
	
	// Wait a bit and generate another ID
	time.Sleep(10 * time.Millisecond)
	id2 := generateDeviceID(hostname)
	assert.NotEmpty(t, id2)
	assert.Contains(t, id2, hostname)
	
	// IDs should be different due to timestamp
	assert.NotEqual(t, id1, id2)
}

// TestGetOSVersion tests OS version detection
func TestGetOSVersion(t *testing.T) {
	version := getOSVersion()
	assert.NotEmpty(t, version)
	assert.NotEqual(t, "Unknown", version)
}

// TestServerStartStop tests starting and stopping the server
func TestServerStartStop(t *testing.T) {
	config := Config{
		MeshIP:     "127.0.0.1", // Use localhost for testing
		Port:       50052,       // Use different port to avoid conflicts
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		OSVersion: "Ubuntu 20.04",
		MeshIP:    "127.0.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50052,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	// Start the server
	err = server.Start()
	require.NoError(t, err)

	// Give it a moment to start
	time.Sleep(100 * time.Millisecond)

	// Stop the server
	err = server.Stop()
	require.NoError(t, err)
}

// TestPairingCodeTimestamp tests that pairing code timestamps are current
func TestPairingCodeTimestamp(t *testing.T) {
	config := Config{
		MeshIP:     "100.64.0.1",
		Port:       50051,
		TLSEnabled: false,
	}

	deviceInfo := &types.Device{
		ID:        "test-device-1",
		Name:      "TestDevice",
		OS:        "linux",
		MeshIP:    "100.64.0.1",
		PublicKey: "test-public-key",
		IsOnline:  true,
		LastSeen:  time.Now(),
		SSHPort:   22,
		GRPCPort:  50051,
	}

	log := logrus.New()
	log.SetLevel(logrus.ErrorLevel)

	server, err := NewServer(config, deviceInfo, log)
	require.NoError(t, err)

	service := &deviceServiceImpl{server: server}

	ctx := context.Background()
	
	// Generate first pairing code
	resp1, err := service.GeneratePairingCode(ctx, &Empty{})
	require.NoError(t, err)
	
	time.Sleep(100 * time.Millisecond)
	
	// Generate second pairing code
	resp2, err := service.GeneratePairingCode(ctx, &Empty{})
	require.NoError(t, err)
	
	// Timestamps should be different
	assert.NotEqual(t, resp1.Timestamp, resp2.Timestamp)
	assert.Greater(t, resp2.Timestamp, resp1.Timestamp)
}
