package ssh

import (
	"crypto/rand"
	"crypto/rsa"
	"net"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	sshlib "github.com/gliderlabs/ssh"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gossh "golang.org/x/crypto/ssh"
)

func TestNewServer(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	t.Run("valid configuration", func(t *testing.T) {
		cfg := Config{
			MeshIP:             "100.64.0.1",
			Port:               2222,
			HostKeyPath:        "/tmp/test_host_key",
			AuthorizedKeysPath: "/tmp/test_authorized_keys",
		}

		server, err := NewServer(cfg, log)
		require.NoError(t, err)
		assert.NotNil(t, server)
		assert.Equal(t, "100.64.0.1", server.config.MeshIP)
		assert.Equal(t, 2222, server.config.Port)
	})

	t.Run("missing mesh IP", func(t *testing.T) {
		cfg := Config{
			Port:        2222,
			HostKeyPath: "/tmp/test_host_key",
		}

		server, err := NewServer(cfg, log)
		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "mesh IP is required")
	})

	t.Run("invalid port", func(t *testing.T) {
		cfg := Config{
			MeshIP:      "100.64.0.1",
			Port:        0,
			HostKeyPath: "/tmp/test_host_key",
		}

		server, err := NewServer(cfg, log)
		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "invalid port")
	})

	t.Run("missing host key path", func(t *testing.T) {
		cfg := Config{
			MeshIP: "100.64.0.1",
			Port:   2222,
		}

		server, err := NewServer(cfg, log)
		assert.Error(t, err)
		assert.Nil(t, server)
		assert.Contains(t, err.Error(), "host key path is required")
	})

	t.Run("default allowed networks", func(t *testing.T) {
		cfg := Config{
			MeshIP:             "100.64.0.1",
			Port:               2222,
			HostKeyPath:        "/tmp/test_host_key",
			AuthorizedKeysPath: "/tmp/test_authorized_keys",
		}

		server, err := NewServer(cfg, log)
		require.NoError(t, err)
		assert.NotNil(t, server)
		assert.Equal(t, []string{"100.64.0.0/10"}, server.config.AllowedNetworks)
	})
}

func TestIsAllowedIP(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	cfg := Config{
		MeshIP:             "100.64.0.1",
		Port:               2222,
		HostKeyPath:        "/tmp/test_host_key",
		AuthorizedKeysPath: "/tmp/test_authorized_keys",
		AllowedNetworks:    []string{"100.64.0.0/10", "192.168.1.0/24"},
	}

	server, err := NewServer(cfg, log)
	require.NoError(t, err)

	tests := []struct {
		name     string
		ip       string
		expected bool
	}{
		{"mesh network IP", "100.64.0.1", true},
		{"mesh network IP 2", "100.64.1.100", true},
		{"mesh network IP 3", "100.127.255.255", true},
		{"local network IP", "192.168.1.50", true},
		{"outside mesh network", "10.0.0.1", false},
		{"public IP", "8.8.8.8", false},
		{"invalid IP", "invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := server.isAllowedIP(tt.ip)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestPasswordHandler(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	cfg := Config{
		MeshIP:             "100.64.0.1",
		Port:               2222,
		HostKeyPath:        "/tmp/test_host_key",
		AuthorizedKeysPath: "/tmp/test_authorized_keys",
	}

	server, err := NewServer(cfg, log)
	require.NoError(t, err)

	// Password authentication should always be denied
	ctx := &mockSSHContext{user: "testuser"}
	result := server.passwordHandler(ctx, "password123")
	assert.False(t, result, "Password authentication should always be denied")
}

func TestPublicKeyHandler(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	cfg := Config{
		MeshIP:             "100.64.0.1",
		Port:               2222,
		HostKeyPath:        "/tmp/test_host_key",
		AuthorizedKeysPath: "/tmp/test_authorized_keys",
	}

	server, err := NewServer(cfg, log)
	require.NoError(t, err)

	// Generate test keys
	privateKey1, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	publicKey1, err := gossh.NewPublicKey(&privateKey1.PublicKey)
	require.NoError(t, err)

	privateKey2, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	publicKey2, err := gossh.NewPublicKey(&privateKey2.PublicKey)
	require.NoError(t, err)

	// Add first key to authorized keys
	server.AddAuthorizedKey(publicKey1)

	ctx := &mockSSHContext{user: "testuser"}

	t.Run("authorized key", func(t *testing.T) {
		result := server.publicKeyHandler(ctx, publicKey1)
		assert.True(t, result, "Authorized key should be accepted")
	})

	t.Run("unauthorized key", func(t *testing.T) {
		result := server.publicKeyHandler(ctx, publicKey2)
		assert.False(t, result, "Unauthorized key should be rejected")
	})
}

func TestAddRemoveAuthorizedKey(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	cfg := Config{
		MeshIP:             "100.64.0.1",
		Port:               2222,
		HostKeyPath:        "/tmp/test_host_key",
		AuthorizedKeysPath: "/tmp/test_authorized_keys",
	}

	server, err := NewServer(cfg, log)
	require.NoError(t, err)

	// Generate test key
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	publicKey, err := gossh.NewPublicKey(&privateKey.PublicKey)
	require.NoError(t, err)

	// Initially no keys
	assert.Equal(t, 0, server.GetAuthorizedKeyCount())

	// Add key
	server.AddAuthorizedKey(publicKey)
	assert.Equal(t, 1, server.GetAuthorizedKeyCount())

	// Remove key
	server.RemoveAuthorizedKey(publicKey)
	assert.Equal(t, 0, server.GetAuthorizedKeyCount())
}

func TestLoadOrGenerateHostKey(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	t.Run("generate new key", func(t *testing.T) {
		tmpDir := t.TempDir()
		keyPath := filepath.Join(tmpDir, "host_key")

		cfg := Config{
			MeshIP:             "100.64.0.1",
			Port:               2222,
			HostKeyPath:        keyPath,
			AuthorizedKeysPath: "/tmp/test_authorized_keys",
		}

		server, err := NewServer(cfg, log)
		require.NoError(t, err)

		// Generate key
		signer, err := server.loadOrGenerateHostKey()
		require.NoError(t, err)
		assert.NotNil(t, signer)

		// Verify key file was created
		_, err = os.Stat(keyPath)
		assert.NoError(t, err)
	})

	t.Run("load existing key", func(t *testing.T) {
		tmpDir := t.TempDir()
		keyPath := filepath.Join(tmpDir, "host_key")

		cfg := Config{
			MeshIP:             "100.64.0.1",
			Port:               2222,
			HostKeyPath:        keyPath,
			AuthorizedKeysPath: "/tmp/test_authorized_keys",
		}

		server, err := NewServer(cfg, log)
		require.NoError(t, err)

		// Generate key first time
		signer1, err := server.loadOrGenerateHostKey()
		require.NoError(t, err)

		// Load key second time
		signer2, err := server.loadOrGenerateHostKey()
		require.NoError(t, err)

		// Keys should be the same
		assert.Equal(t, signer1.PublicKey(), signer2.PublicKey())
	})
}

func TestServerStartStop(t *testing.T) {
	log := logrus.New()
	log.SetOutput(os.Stdout)

	tmpDir := t.TempDir()
	keyPath := filepath.Join(tmpDir, "host_key")

	cfg := Config{
		MeshIP:             "127.0.0.1", // Use localhost for testing
		Port:               2222,
		HostKeyPath:        keyPath,
		AuthorizedKeysPath: filepath.Join(tmpDir, "authorized_keys"),
	}

	server, err := NewServer(cfg, log)
	require.NoError(t, err)

	// Create empty authorized_keys file
	err = os.WriteFile(cfg.AuthorizedKeysPath, []byte(""), 0600)
	require.NoError(t, err)

	// Server should not be running initially
	assert.False(t, server.IsRunning())

	// Start server
	err = server.Start()
	require.NoError(t, err)

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	// Server should be running
	assert.True(t, server.IsRunning())

	// Stop server
	err = server.Stop()
	require.NoError(t, err)

	// Give server time to stop
	time.Sleep(100 * time.Millisecond)

	// Server should not be running
	assert.False(t, server.IsRunning())
}

// Mock SSH context for testing
type mockSSHContext struct {
	user string
	mu   sync.Mutex
}

func (m *mockSSHContext) User() string {
	return m.user
}

func (m *mockSSHContext) SessionID() string {
	return "test-session"
}

func (m *mockSSHContext) ClientVersion() string {
	return "SSH-2.0-Test"
}

func (m *mockSSHContext) ServerVersion() string {
	return "SSH-2.0-Shadowd"
}

func (m *mockSSHContext) RemoteAddr() net.Addr {
	return &net.TCPAddr{IP: net.ParseIP("100.64.0.1"), Port: 12345}
}

func (m *mockSSHContext) LocalAddr() net.Addr {
	return &net.TCPAddr{IP: net.ParseIP("100.64.0.1"), Port: 22}
}

func (m *mockSSHContext) Permissions() *sshlib.Permissions {
	return nil
}

func (m *mockSSHContext) SetValue(key, value interface{}) {}

func (m *mockSSHContext) Value(key interface{}) interface{} {
	return nil
}

func (m *mockSSHContext) Deadline() (deadline time.Time, ok bool) {
	return time.Time{}, false
}

func (m *mockSSHContext) Done() <-chan struct{} {
	return nil
}

func (m *mockSSHContext) Err() error {
	return nil
}

func (m *mockSSHContext) Lock() {
	m.mu.Lock()
}

func (m *mockSSHContext) Unlock() {
	m.mu.Unlock()
}
