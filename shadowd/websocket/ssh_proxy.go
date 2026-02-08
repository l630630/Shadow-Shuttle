package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
)

// Config contains WebSocket SSH proxy configuration
type Config struct {
	// ListenAddr is the address to listen on (e.g., "0.0.0.0:8022")
	ListenAddr string
	
	// SSHHost is the SSH server to connect to (usually "localhost")
	SSHHost string
	
	// SSHPort is the SSH port to connect to
	SSHPort int
}

// Server represents the WebSocket SSH proxy server
type Server struct {
	config   Config
	log      *logrus.Logger
	upgrader websocket.Upgrader
	server   *http.Server
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

// Message types for WebSocket communication
type WSMessage struct {
	Type string `json:"type"` // "connect", "data", "resize", "disconnect"
	
	// Connection parameters
	Host       string `json:"host,omitempty"`
	Port       int    `json:"port,omitempty"`
	Username   string `json:"username,omitempty"`
	Password   string `json:"password,omitempty"`
	PrivateKey string `json:"privateKey,omitempty"`
	
	// Data payload
	Data string `json:"data,omitempty"`
	
	// Terminal resize
	Rows int `json:"rows,omitempty"`
	Cols int `json:"cols,omitempty"`
	
	// Response
	Message string `json:"message,omitempty"`
}

// NewServer creates a new WebSocket SSH proxy server
func NewServer(config Config, log *logrus.Logger) *Server {
	if log == nil {
		log = logrus.New()
	}
	
	ctx, cancel := context.WithCancel(context.Background())
	
	return &Server{
		config: config,
		log:    log,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins for development
				// In production, you should check the origin
				return true
			},
		},
		ctx:    ctx,
		cancel: cancel,
	}
}

// Start starts the WebSocket server
func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleWebSocket)
	
	s.server = &http.Server{
		Addr:    s.config.ListenAddr,
		Handler: mux,
	}
	
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		
		s.log.WithField("address", s.config.ListenAddr).Info("WebSocket SSH proxy listening")
		
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.log.WithError(err).Error("WebSocket server error")
		}
	}()
	
	return nil
}

// Stop stops the WebSocket server
func (s *Server) Stop() error {
	s.log.Info("Stopping WebSocket SSH proxy")
	
	s.cancel()
	
	if s.server != nil {
		if err := s.server.Shutdown(context.Background()); err != nil {
			s.log.WithError(err).Warn("Error shutting down WebSocket server")
		}
	}
	
	s.wg.Wait()
	
	s.log.Info("WebSocket SSH proxy stopped")
	return nil
}

// handleWebSocket handles WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.log.WithError(err).Error("Failed to upgrade WebSocket connection")
		return
	}
	defer conn.Close()
	
	clientIP := r.RemoteAddr
	s.log.WithField("client_ip", clientIP).Info("WebSocket client connected")
	
	// Handle the SSH session
	s.handleSSHSession(conn)
	
	s.log.WithField("client_ip", clientIP).Info("WebSocket client disconnected")
}

// handleSSHSession handles an SSH session over WebSocket
func (s *Server) handleSSHSession(wsConn *websocket.Conn) {
	var sshClient *ssh.Client
	var session *ssh.Session
	var stdin io.WriteCloser
	
	defer func() {
		if stdin != nil {
			stdin.Close()
		}
		if session != nil {
			session.Close()
		}
		if sshClient != nil {
			sshClient.Close()
		}
	}()
	
	for {
		// Read message from WebSocket
		_, message, err := wsConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				s.log.WithError(err).Warn("WebSocket read error")
			}
			break
		}
		
		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			s.log.WithError(err).Error("Failed to parse WebSocket message")
			s.sendError(wsConn, "Invalid message format")
			continue
		}
		
		switch msg.Type {
		case "connect":
			// Connect to SSH server
			if sshClient != nil {
				s.sendError(wsConn, "Already connected")
				continue
			}
			
			// Always connect to local SSH server (ignore client's host/port)
			host := s.config.SSHHost
			port := s.config.SSHPort
			
			s.log.WithFields(logrus.Fields{
				"username": msg.Username,
				"has_password": msg.Password != "",
				"has_key": msg.PrivateKey != "",
			}).Info("Processing SSH connection request")
			
			// Create SSH client config
			config := &ssh.ClientConfig{
				User: msg.Username,
				Auth: []ssh.AuthMethod{},
				HostKeyCallback: ssh.InsecureIgnoreHostKey(), // TODO: Implement proper host key verification
			}
			
			if msg.Password != "" {
				config.Auth = append(config.Auth, ssh.Password(msg.Password))
				s.log.Info("Using password authentication")
			}
			
			if msg.PrivateKey != "" {
				signer, err := ssh.ParsePrivateKey([]byte(msg.PrivateKey))
				if err != nil {
					s.log.WithError(err).Error("Failed to parse private key")
					s.sendError(wsConn, fmt.Sprintf("Invalid private key: %v", err))
					continue
				}
				config.Auth = append(config.Auth, ssh.PublicKeys(signer))
				s.log.Info("Using public key authentication")
			}
			
			if len(config.Auth) == 0 {
				s.log.Error("No authentication method provided")
				s.sendError(wsConn, "No authentication method provided (password or private key required)")
				continue
			}
			
			// Connect to SSH server
			addr := fmt.Sprintf("%s:%d", host, port)
			s.log.WithField("address", addr).Info("Connecting to SSH server")
			
			client, err := ssh.Dial("tcp", addr, config)
			if err != nil {
				s.log.WithError(err).Error("Failed to connect to SSH server")
				s.sendError(wsConn, fmt.Sprintf("SSH connection failed: %v", err))
				continue
			}
			sshClient = client
			
			// Create SSH session
			sess, err := client.NewSession()
			if err != nil {
				s.log.WithError(err).Error("Failed to create SSH session")
				s.sendError(wsConn, fmt.Sprintf("Failed to create session: %v", err))
				sshClient.Close()
				sshClient = nil
				continue
			}
			session = sess
			
			// Request PTY
			if err := session.RequestPty("xterm-256color", 40, 80, ssh.TerminalModes{}); err != nil {
				s.log.WithError(err).Error("Failed to request PTY")
				s.sendError(wsConn, fmt.Sprintf("Failed to request PTY: %v", err))
				session.Close()
				session = nil
				sshClient.Close()
				sshClient = nil
				continue
			}
			
			// Get stdin/stdout pipes
			stdinPipe, err := session.StdinPipe()
			if err != nil {
				s.log.WithError(err).Error("Failed to get stdin pipe")
				s.sendError(wsConn, fmt.Sprintf("Failed to get stdin: %v", err))
				session.Close()
				session = nil
				sshClient.Close()
				sshClient = nil
				continue
			}
			stdin = stdinPipe  // Save for later use
			
			stdout, err := session.StdoutPipe()
			if err != nil {
				s.log.WithError(err).Error("Failed to get stdout pipe")
				s.sendError(wsConn, fmt.Sprintf("Failed to get stdout: %v", err))
				session.Close()
				session = nil
				sshClient.Close()
				sshClient = nil
				continue
			}
			
			stderr, err := session.StderrPipe()
			if err != nil {
				s.log.WithError(err).Error("Failed to get stderr pipe")
				s.sendError(wsConn, fmt.Sprintf("Failed to get stderr: %v", err))
				session.Close()
				session = nil
				sshClient.Close()
				sshClient = nil
				continue
			}
			
			// Start shell
			if err := session.Shell(); err != nil {
				s.log.WithError(err).Error("Failed to start shell")
				s.sendError(wsConn, fmt.Sprintf("Failed to start shell: %v", err))
				continue
			}
			
			// Forward SSH output to WebSocket
			go s.forwardOutput(wsConn, stdout, "stdout")
			go s.forwardOutput(wsConn, stderr, "stderr")
			
			// Send connected message
			s.sendMessage(wsConn, WSMessage{
				Type:    "connected",
				Message: "SSH connection established",
			})
			
			s.log.Info("SSH session established")
			
		case "data":
			// Forward data to SSH
			if session == nil || stdin == nil {
				s.sendError(wsConn, "Not connected to SSH server")
				continue
			}
			
			if _, err := stdin.Write([]byte(msg.Data)); err != nil {
				s.log.WithError(err).Error("Failed to write to SSH stdin")
				s.sendError(wsConn, fmt.Sprintf("Write failed: %v", err))
			}
			
		case "resize":
			// Resize terminal
			if session == nil {
				s.sendError(wsConn, "Not connected to SSH server")
				continue
			}
			
			if err := session.WindowChange(msg.Rows, msg.Cols); err != nil {
				s.log.WithError(err).Warn("Failed to resize terminal")
			}
			
		case "disconnect":
			// Close SSH connection
			s.log.Info("Client requested disconnect")
			return
		}
	}
}

// forwardOutput forwards SSH output to WebSocket
func (s *Server) forwardOutput(wsConn *websocket.Conn, reader interface{ Read([]byte) (int, error) }, streamType string) {
	buf := make([]byte, 32*1024)
	
	for {
		n, err := reader.Read(buf)
		if err != nil {
			if err.Error() != "EOF" {
				s.log.WithError(err).WithField("stream", streamType).Debug("SSH output stream closed")
			}
			break
		}
		
		if n > 0 {
			msg := WSMessage{
				Type: "data",
				Data: string(buf[:n]),
			}
			
			if err := s.sendMessage(wsConn, msg); err != nil {
				s.log.WithError(err).Error("Failed to send data to WebSocket")
				break
			}
		}
	}
}

// sendMessage sends a message to the WebSocket client
func (s *Server) sendMessage(conn *websocket.Conn, msg WSMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	
	return conn.WriteMessage(websocket.TextMessage, data)
}

// sendError sends an error message to the WebSocket client
func (s *Server) sendError(conn *websocket.Conn, errMsg string) {
	msg := WSMessage{
		Type:    "error",
		Message: errMsg,
	}
	s.sendMessage(conn, msg)
}
