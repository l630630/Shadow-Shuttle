package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config represents the main configuration for Shadowd
type Config struct {
	Headscale HeadscaleConfig `yaml:"headscale"`
	SSH       SSHConfig       `yaml:"ssh"`
	GRPC      GRPCConfig      `yaml:"grpc"`
	Device    DeviceConfig    `yaml:"device"`
}

// HeadscaleConfig contains Headscale server connection settings
type HeadscaleConfig struct {
	URL        string `yaml:"url"`
	PreauthKey string `yaml:"preauth_key"`
}

// SSHConfig contains SSH server settings
type SSHConfig struct {
	Port               int               `yaml:"port"`
	HostKeyPath        string            `yaml:"host_key_path"`
	AuthorizedKeysPath string            `yaml:"authorized_keys_path"`
	AllowedNetworks    []string          `yaml:"allowed_networks"`
	Users              map[string]string `yaml:"users"` // username -> password
}

// GRPCConfig contains gRPC server settings
type GRPCConfig struct {
	Port       int  `yaml:"port"`
	TLSEnabled bool `yaml:"tls_enabled"`
}

// DeviceConfig contains device information
type DeviceConfig struct {
	Name string `yaml:"name"`
}

// LoadConfig reads and parses the YAML configuration file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Validate configuration
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	if c.Headscale.URL == "" {
		return fmt.Errorf("headscale.url is required")
	}
	if c.Headscale.PreauthKey == "" {
		return fmt.Errorf("headscale.preauth_key is required")
	}
	if c.SSH.Port <= 0 || c.SSH.Port > 65535 {
		return fmt.Errorf("ssh.port must be between 1 and 65535")
	}
	if c.SSH.HostKeyPath == "" {
		return fmt.Errorf("ssh.host_key_path is required")
	}
	if c.SSH.AuthorizedKeysPath == "" {
		return fmt.Errorf("ssh.authorized_keys_path is required")
	}
	if c.GRPC.Port <= 0 || c.GRPC.Port > 65535 {
		return fmt.Errorf("grpc.port must be between 1 and 65535")
	}
	if c.Device.Name == "" {
		return fmt.Errorf("device.name is required")
	}
	return nil
}

// SaveConfig writes the configuration to a YAML file
func SaveConfig(path string, config *Config) error {
	data, err := yaml.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// DefaultConfig returns a configuration with default values
func DefaultConfig() *Config {
	return &Config{
		Headscale: HeadscaleConfig{
			URL:        "https://headscale.example.com",
			PreauthKey: "",
		},
		SSH: SSHConfig{
			Port:               22,
			HostKeyPath:        "/etc/shadowd/ssh_host_key",
			AuthorizedKeysPath: "/etc/shadowd/authorized_keys",
			AllowedNetworks:    []string{"100.64.0.0/10"},
		},
		GRPC: GRPCConfig{
			Port:       50051,
			TLSEnabled: false,
		},
		Device: DeviceConfig{
			Name: "MyComputer",
		},
	}
}
