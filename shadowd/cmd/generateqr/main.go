package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"time"

	qrterminal "github.com/mdp/qrterminal/v3"
)

// PairingCode matches the mobile app's PairingCode interface
type PairingCode struct {
	DeviceID  string `json:"deviceId"`
	MeshIP    string `json:"meshIP"`
	SSHPort   int    `json:"sshPort"`
	GRPCPort  int    `json:"grpcPort"`
	PublicKey string `json:"publicKey"`
	Timestamp int64  `json:"timestamp"`
	Signature string `json:"signature"`
}

func main() {
	ip := getPreferredLocalIP()

	hostname, err := os.Hostname()
	if err != nil || hostname == "" {
		hostname = "shadowd"
	}

	now := time.Now().UnixMilli()

	code := PairingCode{
		DeviceID:  fmt.Sprintf("%s-%d", hostname, now),
		MeshIP:    ip,
		SSHPort:   2222,
		GRPCPort:  50051,
		PublicKey: "",
		Timestamp: now,
		Signature: "",
	}

	data, err := json.Marshal(code)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to marshal pairing code: %v\n", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("Shadow Shuttle - 设备配对二维码")
	fmt.Println()

	cfg := qrterminal.Config{
		Level:     qrterminal.M,
		Writer:    os.Stdout,
		BlackChar: qrterminal.BLACK,
		WhiteChar: qrterminal.WHITE,
		QuietZone: 1,
	}

	qrterminal.GenerateWithConfig(string(data), cfg)

	fmt.Println()
	fmt.Printf("设备名称: %s\n", hostname)
	fmt.Printf("局域网 IP: %s\n", ip)
	fmt.Println()
	fmt.Println("请在手机 App 中打开「扫描二维码」，对准此终端中的二维码完成配对。")
	fmt.Println()
}

// getPreferredLocalIP tries to return a private LAN IP if possible
func getPreferredLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "127.0.0.1"
	}

	var fallback string

	for _, a := range addrs {
		ipnet, ok := a.(*net.IPNet)
		if !ok || ipnet.IP.IsLoopback() {
			continue
		}
		if ip4 := ipnet.IP.To4(); ip4 != nil {
			if isPrivateIP(ip4) {
				return ip4.String()
			}
			if fallback == "" {
				fallback = ip4.String()
			}
		}
	}

	if fallback != "" {
		return fallback
	}

	return "127.0.0.1"
}

// isPrivateIP checks common private IPv4 ranges
func isPrivateIP(ip net.IP) bool {
	// 10.0.0.0/8
	if ip[0] == 10 {
		return true
	}
	// 172.16.0.0/12
	if ip[0] == 172 && ip[1] >= 16 && ip[1] <= 31 {
		return true
	}
	// 192.168.0.0/16
	if ip[0] == 192 && ip[1] == 168 {
		return true
	}
	return false
}

