package network

import (
	"fmt"
	"net"
)

// GetLocalIP returns the non-loopback local IP of the host
func GetLocalIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	for _, address := range addrs {
		// Check if the address is an IP address (not a network address)
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String(), nil
			}
		}
	}

	return "", fmt.Errorf("no non-loopback IP address found")
}

// GetPreferredLocalIP returns the preferred local IP address
// Prefers private network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
func GetPreferredLocalIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	var fallbackIP string

	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ip := ipnet.IP.String()
				
				// Check if it's a private network IP
				if isPrivateIP(ipnet.IP) {
					return ip, nil
				}
				
				// Keep as fallback
				if fallbackIP == "" {
					fallbackIP = ip
				}
			}
		}
	}

	if fallbackIP != "" {
		return fallbackIP, nil
	}

	return "", fmt.Errorf("no suitable IP address found")
}

// isPrivateIP checks if an IP is in a private network range
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
