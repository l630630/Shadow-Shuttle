package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	// Create a temporary config file
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "test_config.yaml")

	configContent := `
headscale:
  url: https://test.example.com
  preauth_key: test-key-123

ssh:
  port: 22
  host_key_path: /tmp/test_key
  authorized_keys_path: /tmp/authorized_keys

grpc:
  port: 50051
  tls_enabled: false

device:
  name: TestDevice
`

	if err := os.WriteFile(configPath, []byte(configContent), 0600); err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	// Test loading the config
	cfg, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	// Verify configuration values
	if cfg.Headscale.URL != "https://test.example.com" {
		t.Errorf("Expected URL 'https://test.example.com', got '%s'", cfg.Headscale.URL)
	}
	if cfg.Headscale.PreauthKey != "test-key-123" {
		t.Errorf("Expected PreauthKey 'test-key-123', got '%s'", cfg.Headscale.PreauthKey)
	}
	if cfg.SSH.Port != 22 {
		t.Errorf("Expected SSH port 22, got %d", cfg.SSH.Port)
	}
	if cfg.SSH.HostKeyPath != "/tmp/test_key" {
		t.Errorf("Expected HostKeyPath '/tmp/test_key', got '%s'", cfg.SSH.HostKeyPath)
	}
	if cfg.GRPC.Port != 50051 {
		t.Errorf("Expected GRPC port 50051, got %d", cfg.GRPC.Port)
	}
	if cfg.GRPC.TLSEnabled != false {
		t.Errorf("Expected TLSEnabled false, got %v", cfg.GRPC.TLSEnabled)
	}
	if cfg.Device.Name != "TestDevice" {
		t.Errorf("Expected Device name 'TestDevice', got '%s'", cfg.Device.Name)
	}
}

func TestLoadConfigFileNotFound(t *testing.T) {
	_, err := LoadConfig("/nonexistent/config.yaml")
	if err == nil {
		t.Error("Expected error for nonexistent file, got nil")
	}
}

func TestLoadConfigInvalidYAML(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "invalid.yaml")

	invalidContent := `
headscale:
  url: https://test.example.com
  invalid yaml content [[[
`

	if err := os.WriteFile(configPath, []byte(invalidContent), 0600); err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	_, err := LoadConfig(configPath)
	if err == nil {
		t.Error("Expected error for invalid YAML, got nil")
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: false,
		},
		{
			name: "missing headscale URL",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "headscale.url is required",
		},
		{
			name: "missing preauth key",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "headscale.preauth_key is required",
		},
		{
			name: "invalid SSH port (too low)",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               0,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "ssh.port must be between 1 and 65535",
		},
		{
			name: "invalid SSH port (too high)",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               70000,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "ssh.port must be between 1 and 65535",
		},
		{
			name: "missing host key path",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "ssh.host_key_path is required",
		},
		{
			name: "invalid GRPC port",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       -1,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "TestDevice",
				},
			},
			wantErr: true,
			errMsg:  "grpc.port must be between 1 and 65535",
		},
		{
			name: "missing device name",
			config: Config{
				Headscale: HeadscaleConfig{
					URL:        "https://test.example.com",
					PreauthKey: "test-key",
				},
				SSH: SSHConfig{
					Port:               22,
					HostKeyPath:        "/tmp/key",
					AuthorizedKeysPath: "/tmp/authorized_keys",
				},
				GRPC: GRPCConfig{
					Port:       50051,
					TLSEnabled: false,
				},
				Device: DeviceConfig{
					Name: "",
				},
			},
			wantErr: true,
			errMsg:  "device.name is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error, got nil")
				} else if err.Error() != tt.errMsg {
					t.Errorf("Expected error message '%s', got '%s'", tt.errMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got: %v", err)
				}
			}
		})
	}
}

func TestSaveConfig(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "save_test.yaml")

	cfg := &Config{
		Headscale: HeadscaleConfig{
			URL:        "https://save.example.com",
			PreauthKey: "save-key-123",
		},
		SSH: SSHConfig{
			Port:               2222,
			HostKeyPath:        "/tmp/save_key",
			AuthorizedKeysPath: "/tmp/authorized_keys",
		},
		GRPC: GRPCConfig{
			Port:       50052,
			TLSEnabled: true,
		},
		Device: DeviceConfig{
			Name: "SaveTestDevice",
		},
	}

	// Save the config
	if err := SaveConfig(configPath, cfg); err != nil {
		t.Fatalf("SaveConfig failed: %v", err)
	}

	// Load it back and verify
	loadedCfg, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	if loadedCfg.Headscale.URL != cfg.Headscale.URL {
		t.Errorf("URL mismatch: expected '%s', got '%s'", cfg.Headscale.URL, loadedCfg.Headscale.URL)
	}
	if loadedCfg.SSH.Port != cfg.SSH.Port {
		t.Errorf("SSH port mismatch: expected %d, got %d", cfg.SSH.Port, loadedCfg.SSH.Port)
	}
	if loadedCfg.GRPC.TLSEnabled != cfg.GRPC.TLSEnabled {
		t.Errorf("TLS enabled mismatch: expected %v, got %v", cfg.GRPC.TLSEnabled, loadedCfg.GRPC.TLSEnabled)
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg.Headscale.URL == "" {
		t.Error("Default config should have a URL")
	}
	if cfg.SSH.Port <= 0 {
		t.Error("Default config should have a valid SSH port")
	}
	if cfg.GRPC.Port <= 0 {
		t.Error("Default config should have a valid GRPC port")
	}
	if cfg.Device.Name == "" {
		t.Error("Default config should have a device name")
	}
}

func TestConfigRoundTrip(t *testing.T) {
	// Test that saving and loading a config preserves all values
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "roundtrip.yaml")

	original := &Config{
		Headscale: HeadscaleConfig{
			URL:        "https://roundtrip.example.com",
			PreauthKey: "roundtrip-key",
		},
		SSH: SSHConfig{
			Port:               3333,
			HostKeyPath:        "/tmp/roundtrip_key",
			AuthorizedKeysPath: "/tmp/authorized_keys",
		},
		GRPC: GRPCConfig{
			Port:       50053,
			TLSEnabled: true,
		},
		Device: DeviceConfig{
			Name: "RoundTripDevice",
		},
	}

	// Save
	if err := SaveConfig(configPath, original); err != nil {
		t.Fatalf("SaveConfig failed: %v", err)
	}

	// Load
	loaded, err := LoadConfig(configPath)
	if err != nil {
		t.Fatalf("LoadConfig failed: %v", err)
	}

	// Compare all fields
	if loaded.Headscale.URL != original.Headscale.URL {
		t.Errorf("Headscale URL mismatch")
	}
	if loaded.Headscale.PreauthKey != original.Headscale.PreauthKey {
		t.Errorf("Headscale PreauthKey mismatch")
	}
	if loaded.SSH.Port != original.SSH.Port {
		t.Errorf("SSH Port mismatch")
	}
	if loaded.SSH.HostKeyPath != original.SSH.HostKeyPath {
		t.Errorf("SSH HostKeyPath mismatch")
	}
	if loaded.GRPC.Port != original.GRPC.Port {
		t.Errorf("GRPC Port mismatch")
	}
	if loaded.GRPC.TLSEnabled != original.GRPC.TLSEnabled {
		t.Errorf("GRPC TLSEnabled mismatch")
	}
	if loaded.Device.Name != original.Device.Name {
		t.Errorf("Device Name mismatch")
	}
}
