package ssh

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/gliderlabs/ssh"
	"github.com/sirupsen/logrus"
	gossh "golang.org/x/crypto/ssh"
)

// Server represents an SSH server that listens on the Mesh IP
type Server struct {
	config    Config
	server    *ssh.Server
	log       *logrus.Logger
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
	running   bool
	mu        sync.RWMutex
	
	// Authorized keys for authentication
	authorizedKeys map[string]gossh.PublicKey
}

// Config contains SSH server configuration
type Config struct {
	// MeshIP is the IP address to listen on (from WireGuard)
	MeshIP string
	
	// Port is the SSH port to listen on
	Port int
	
	// HostKeyPath is the path to the SSH host key
	HostKeyPath string
	
	// AllowedNetworks are the CIDR ranges allowed to connect (Mesh network only)
	AllowedNetworks []string
	
	// AuthorizedKeysPath is the path to the authorized_keys file
	AuthorizedKeysPath string
	
	// Users contains username -> password mappings for password authentication
	Users map[string]string
}

// NewServer creates a new SSH server instance
func NewServer(cfg Config, log *logrus.Logger) (*Server, error) {
	if cfg.MeshIP == "" {
		return nil, fmt.Errorf("mesh IP is required")
	}
	if cfg.Port <= 0 || cfg.Port > 65535 {
		return nil, fmt.Errorf("invalid port: %d", cfg.Port)
	}
	if cfg.HostKeyPath == "" {
		return nil, fmt.Errorf("host key path is required")
	}
	
	// Default to Mesh network CIDR if not specified
	if len(cfg.AllowedNetworks) == 0 {
		cfg.AllowedNetworks = []string{"100.64.0.0/10"}
	}
	
	ctx, cancel := context.WithCancel(context.Background())
	
	s := &Server{
		config:         cfg,
		log:            log,
		ctx:            ctx,
		cancel:         cancel,
		authorizedKeys: make(map[string]gossh.PublicKey),
	}
	
	return s, nil
}

// Start initializes and starts the SSH server
func (s *Server) Start() error {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return fmt.Errorf("SSH server already running")
	}
	s.mu.Unlock()
	
	s.log.Info("Starting SSH server")
	
	// Load or generate host key
	hostKey, err := s.loadOrGenerateHostKey()
	if err != nil {
		return fmt.Errorf("failed to load host key: %w", err)
	}
	
	// Load authorized keys
	if err := s.loadAuthorizedKeys(); err != nil {
		s.log.WithError(err).Warn("Failed to load authorized keys, continuing without key-based auth")
	}
	
	// Create SSH server
	s.server = &ssh.Server{
		Addr: fmt.Sprintf("%s:%d", s.config.MeshIP, s.config.Port),
		Handler: s.sessionHandler,
		PublicKeyHandler: s.publicKeyHandler,
		PasswordHandler: s.passwordHandler, // Always deny passwords
	}
	
	// Add host key
	s.server.AddHostKey(hostKey)
	
	// Start server in goroutine
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		
		s.mu.Lock()
		s.running = true
		s.mu.Unlock()
		
		s.log.WithFields(logrus.Fields{
			"address": s.server.Addr,
		}).Info("SSH server listening")
		
		if err := s.server.ListenAndServe(); err != nil && err != ssh.ErrServerClosed {
			s.log.WithError(err).Error("SSH server error")
		}
		
		s.mu.Lock()
		s.running = false
		s.mu.Unlock()
	}()
	
	return nil
}

// Stop gracefully shuts down the SSH server
func (s *Server) Stop() error {
	s.log.Info("Stopping SSH server")
	
	s.cancel()
	
	if s.server != nil {
		if err := s.server.Close(); err != nil {
			s.log.WithError(err).Warn("Error closing SSH server")
		}
	}
	
	s.wg.Wait()
	
	s.log.Info("SSH server stopped")
	return nil
}

// IsRunning returns whether the server is currently running
func (s *Server) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.running
}

// sessionHandler handles SSH sessions
func (s *Server) sessionHandler(sess ssh.Session) {
	// Check if connection is from allowed network
	remoteAddr := sess.RemoteAddr().String()
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		s.log.WithError(err).Warn("Failed to parse remote address")
		io.WriteString(sess, "Access denied\n")
		sess.Exit(1)
		return
	}
	
	if !s.isAllowedIP(host) {
		s.log.WithFields(logrus.Fields{
			"remote_ip": host,
		}).Warn("Connection attempt from unauthorized network")
		io.WriteString(sess, "Access denied: not from Mesh network\n")
		sess.Exit(1)
		return
	}
	
	s.log.WithFields(logrus.Fields{
		"user":      sess.User(),
		"remote_ip": host,
	}).Info("SSH session started")
	
	// Get PTY if requested
	ptyReq, winCh, isPty := sess.Pty()
	if isPty {
		s.log.WithFields(logrus.Fields{
			"term":   ptyReq.Term,
			"width":  ptyReq.Window.Width,
			"height": ptyReq.Window.Height,
		}).Debug("PTY requested")
	}
	
	// Handle shell or command execution
	cmd := sess.Command()
	if len(cmd) == 0 {
		// Interactive shell
		s.handleShell(sess, isPty, winCh)
	} else {
		// Command execution
		s.handleCommand(sess, cmd)
	}
	
	s.log.WithField("user", sess.User()).Info("SSH session ended")
}

// handleShell handles interactive shell sessions
func (s *Server) handleShell(sess ssh.Session, isPty bool, winCh <-chan ssh.Window) {
	// Spawn a real shell process
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/sh"
	}
	
	cmd := exec.Command(shell)
	
	// Set working directory to user's home directory
	// Try multiple methods to get home directory
	homeDir := os.Getenv("HOME")
	if homeDir == "" {
		var err error
		homeDir, err = os.UserHomeDir()
		if err != nil {
			s.log.WithError(err).Warn("Failed to get user home directory, using current directory")
		}
	}
	
	if homeDir != "" {
		cmd.Dir = homeDir
		s.log.WithFields(logrus.Fields{
			"home_dir": homeDir,
			"shell":    shell,
		}).Info("Setting shell working directory to home")
	} else {
		s.log.Warn("Home directory is empty, using current directory")
	}
	
	// Set up PTY if requested
	if isPty {
		ptyReq, _, _ := sess.Pty()
		cmd.Env = append(os.Environ(), fmt.Sprintf("TERM=%s", ptyReq.Term))
		
		// Create PTY
		ptmx, err := pty.Start(cmd)
		if err != nil {
			s.log.WithError(err).Error("Failed to start PTY")
			io.WriteString(sess, fmt.Sprintf("Failed to start shell: %v\n", err))
			sess.Exit(1)
			return
		}
		defer ptmx.Close()
		
		// Handle window size changes
		go func() {
			for win := range winCh {
				pty.Setsize(ptmx, &pty.Winsize{
					Rows: uint16(win.Height),
					Cols: uint16(win.Width),
				})
			}
		}()
		
		// Copy data between SSH session and PTY
		go func() {
			io.Copy(ptmx, sess)
		}()
		io.Copy(sess, ptmx)
		
		cmd.Wait()
	} else {
		// No PTY, use pipes
		cmd.Stdin = sess
		cmd.Stdout = sess
		cmd.Stderr = sess.Stderr()
		
		if err := cmd.Run(); err != nil {
			s.log.WithError(err).Error("Shell execution failed")
			sess.Exit(1)
			return
		}
	}
}

// handleCommand handles command execution
func (s *Server) handleCommand(sess ssh.Session, cmd []string) {
	// Execute the command
	command := exec.Command(cmd[0], cmd[1:]...)
	command.Stdin = sess
	command.Stdout = sess
	command.Stderr = sess.Stderr()
	
	// Set working directory to user's home directory
	homeDir := os.Getenv("HOME")
	if homeDir == "" {
		var err error
		homeDir, err = os.UserHomeDir()
		if err != nil {
			s.log.WithError(err).Warn("Failed to get user home directory for command execution")
		}
	}
	
	if homeDir != "" {
		command.Dir = homeDir
		s.log.WithFields(logrus.Fields{
			"home_dir": homeDir,
			"command":  cmd,
		}).Info("Setting command working directory to home")
	}
	
	if err := command.Run(); err != nil {
		s.log.WithError(err).WithField("command", cmd).Error("Command execution failed")
		if exitErr, ok := err.(*exec.ExitError); ok {
			sess.Exit(exitErr.ExitCode())
		} else {
			sess.Exit(1)
		}
		return
	}
	
	sess.Exit(0)
}

// publicKeyHandler handles public key authentication
func (s *Server) publicKeyHandler(ctx ssh.Context, key ssh.PublicKey) bool {
	// Check if the public key is authorized
	keyStr := string(gossh.MarshalAuthorizedKey(key))
	
	for _, authorizedKey := range s.authorizedKeys {
		if ssh.KeysEqual(key, authorizedKey) {
			s.log.WithFields(logrus.Fields{
				"user":        ctx.User(),
				"fingerprint": gossh.FingerprintSHA256(key),
			}).Info("Public key authentication successful")
			return true
		}
	}
	
	s.log.WithFields(logrus.Fields{
		"user":        ctx.User(),
		"fingerprint": gossh.FingerprintSHA256(key),
		"key":         keyStr[:min(len(keyStr), 50)] + "...",
	}).Warn("Public key authentication failed: key not authorized")
	
	return false
}

// passwordHandler handles password authentication
// Uses user accounts from configuration file
func (s *Server) passwordHandler(ctx ssh.Context, password string) bool {
	username := ctx.User()
	
	// Check if user exists in configuration
	if validPassword, exists := s.config.Users[username]; exists {
		if password == validPassword {
			s.log.WithFields(logrus.Fields{
				"user": username,
			}).Info("Password authentication successful")
			return true
		}
	}
	
	s.log.WithFields(logrus.Fields{
		"user": username,
	}).Warn("Password authentication failed: invalid credentials")
	return false
}

// isAllowedIP checks if an IP address is in the allowed networks
func (s *Server) isAllowedIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}
	
	for _, cidr := range s.config.AllowedNetworks {
		_, network, err := net.ParseCIDR(cidr)
		if err != nil {
			s.log.WithError(err).WithField("cidr", cidr).Warn("Invalid CIDR in allowed networks")
			continue
		}
		
		if network.Contains(ip) {
			return true
		}
	}
	
	return false
}

// loadOrGenerateHostKey loads the host key or generates a new one
func (s *Server) loadOrGenerateHostKey() (gossh.Signer, error) {
	// Try to load existing key
	if _, err := os.Stat(s.config.HostKeyPath); err == nil {
		keyData, err := os.ReadFile(s.config.HostKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read host key: %w", err)
		}
		
		signer, err := gossh.ParsePrivateKey(keyData)
		if err != nil {
			return nil, fmt.Errorf("failed to parse host key: %w", err)
		}
		
		s.log.WithField("path", s.config.HostKeyPath).Info("Loaded existing host key")
		return signer, nil
	}
	
	// Generate new key
	s.log.WithField("path", s.config.HostKeyPath).Info("Generating new host key")
	
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, fmt.Errorf("failed to generate RSA key: %w", err)
	}
	
	// Save private key
	privateKeyPEM := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	}
	
	keyFile, err := os.OpenFile(s.config.HostKeyPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return nil, fmt.Errorf("failed to create host key file: %w", err)
	}
	defer keyFile.Close()
	
	if err := pem.Encode(keyFile, privateKeyPEM); err != nil {
		return nil, fmt.Errorf("failed to write host key: %w", err)
	}
	
	// Convert to SSH signer
	signer, err := gossh.NewSignerFromKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create signer: %w", err)
	}
	
	s.log.Info("Generated and saved new host key")
	return signer, nil
}

// loadAuthorizedKeys loads authorized public keys from file
func (s *Server) loadAuthorizedKeys() error {
	if s.config.AuthorizedKeysPath == "" {
		return fmt.Errorf("authorized keys path not configured")
	}
	
	data, err := os.ReadFile(s.config.AuthorizedKeysPath)
	if err != nil {
		return fmt.Errorf("failed to read authorized keys: %w", err)
	}
	
	// Parse authorized keys
	for len(data) > 0 {
		pubKey, _, _, rest, err := gossh.ParseAuthorizedKey(data)
		if err != nil {
			s.log.WithError(err).Warn("Failed to parse authorized key, skipping")
			break
		}
		
		keyStr := string(gossh.MarshalAuthorizedKey(pubKey))
		s.authorizedKeys[keyStr] = pubKey
		
		data = rest
	}
	
	s.log.WithField("count", len(s.authorizedKeys)).Info("Loaded authorized keys")
	return nil
}

// AddAuthorizedKey adds a public key to the authorized keys
func (s *Server) AddAuthorizedKey(key gossh.PublicKey) {
	keyStr := string(gossh.MarshalAuthorizedKey(key))
	s.authorizedKeys[keyStr] = key
	s.log.WithField("fingerprint", gossh.FingerprintSHA256(key)).Info("Added authorized key")
}

// RemoveAuthorizedKey removes a public key from the authorized keys
func (s *Server) RemoveAuthorizedKey(key gossh.PublicKey) {
	keyStr := string(gossh.MarshalAuthorizedKey(key))
	delete(s.authorizedKeys, keyStr)
	s.log.WithField("fingerprint", gossh.FingerprintSHA256(key)).Info("Removed authorized key")
}

// GetAuthorizedKeyCount returns the number of authorized keys
func (s *Server) GetAuthorizedKeyCount() int {
	return len(s.authorizedKeys)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
