//
//  PacketTunnelProvider.swift
//  VPNExtension
//
//  WireGuard packet tunnel provider
//

import NetworkExtension
import os.log

class PacketTunnelProvider: NEPacketTunnelProvider {
    
    private let log = OSLog(subsystem: "com.shadowshuttle.ShadowShuttleTemp.VPNExtension", category: "PacketTunnel")
    
    private var wireguardAdapter: Any? // WireGuardAdapter from WireGuardKit
    
    override func startTunnel(options: [String : NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        os_log("Starting tunnel", log: log, type: .info)
        
        // Get configuration from provider configuration
        guard let providerConfiguration = protocolConfiguration as? NETunnelProviderProtocol,
              let config = providerConfiguration.providerConfiguration else {
            os_log("Missing provider configuration", log: log, type: .error)
            completionHandler(PacketTunnelProviderError.missingConfiguration)
            return
        }
        
        // Extract configuration string
        guard let configString = config["configString"] as? String else {
            os_log("Missing config string", log: log, type: .error)
            completionHandler(PacketTunnelProviderError.invalidConfiguration)
            return
        }
        
        os_log("Configuration loaded, length: %d", log: log, type: .debug, configString.count)
        
        // Parse and start WireGuard tunnel
        startWireGuardTunnel(configString: configString, completionHandler: completionHandler)
    }
    
    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        os_log("Stopping tunnel, reason: %{public}@", log: log, type: .info, String(describing: reason))
        
        // Stop WireGuard adapter
        stopWireGuardTunnel()
        
        completionHandler()
    }
    
    override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
        os_log("Received app message", log: log, type: .debug)
        
        // Handle messages from main app if needed
        // For example: configuration updates, statistics requests, etc.
        
        completionHandler?(nil)
    }
    
    override func sleep(completionHandler: @escaping () -> Void) {
        os_log("Entering sleep mode", log: log, type: .info)
        completionHandler()
    }
    
    override func wake() {
        os_log("Waking from sleep", log: log, type: .info)
    }
    
    // MARK: - Private Methods
    
    private func startWireGuardTunnel(configString: String, completionHandler: @escaping (Error?) -> Void) {
        // Note: This is a simplified implementation
        // In production, you would use WireGuardKit to create and manage the tunnel
        
        // For now, we'll create a basic tunnel configuration
        let tunnelNetworkSettings = createTunnelNetworkSettings(from: configString)
        
        setTunnelNetworkSettings(tunnelNetworkSettings) { [weak self] error in
            guard let self = self else {
                completionHandler(PacketTunnelProviderError.unknown)
                return
            }
            
            if let error = error {
                os_log("Failed to set tunnel network settings: %{public}@", log: self.log, type: .error, error.localizedDescription)
                completionHandler(error)
                return
            }
            
            os_log("Tunnel network settings configured", log: self.log, type: .info)
            
            // TODO: Initialize WireGuardKit adapter here
            // self.wireguardAdapter = WireGuardAdapter(...)
            
            completionHandler(nil)
        }
    }
    
    private func stopWireGuardTunnel() {
        // TODO: Stop WireGuardKit adapter
        // wireguardAdapter?.stop()
        wireguardAdapter = nil
        
        os_log("WireGuard tunnel stopped", log: log, type: .info)
    }
    
    private func createTunnelNetworkSettings(from configString: String) -> NEPacketTunnelNetworkSettings {
        // Parse configuration to extract network settings
        let config = parseConfiguration(configString)
        
        // Extract address (e.g., "100.64.0.2/32")
        let address = config["address"] ?? "10.0.0.2"
        let addressComponents = address.components(separatedBy: "/")
        let ipAddress = addressComponents.first ?? "10.0.0.2"
        let subnetMask = addressComponents.count > 1 ? addressComponents[1] : "32"
        
        // Create network settings
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: ipAddress)
        
        // Configure IPv4 settings
        let ipv4Settings = NEIPv4Settings(addresses: [ipAddress], subnetMasks: [subnetMaskFromPrefix(subnetMask)])
        ipv4Settings.includedRoutes = [NEIPv4Route.default()]
        settings.ipv4Settings = ipv4Settings
        
        // Configure DNS settings
        if let dns = config["dns"] {
            let dnsServers = dns.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            settings.dnsSettings = NEDNSSettings(servers: dnsServers)
        }
        
        // Configure MTU
        if let mtuString = config["mtu"], let mtu = Int(mtuString) {
            settings.mtu = NSNumber(value: mtu)
        } else {
            settings.mtu = 1420 // Default WireGuard MTU
        }
        
        return settings
    }
    
    private func parseConfiguration(_ configString: String) -> [String: String] {
        var config: [String: String] = [:]
        
        let lines = configString.components(separatedBy: .newlines)
        var inInterfaceSection = false
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            
            if trimmed.isEmpty || trimmed.hasPrefix("#") {
                continue
            }
            
            if trimmed == "[Interface]" {
                inInterfaceSection = true
                continue
            } else if trimmed.hasPrefix("[") {
                inInterfaceSection = false
                continue
            }
            
            if inInterfaceSection {
                let parts = trimmed.components(separatedBy: "=")
                if parts.count == 2 {
                    let key = parts[0].trimmingCharacters(in: .whitespaces).lowercased()
                    let value = parts[1].trimmingCharacters(in: .whitespaces)
                    config[key] = value
                }
            }
        }
        
        return config
    }
    
    private func subnetMaskFromPrefix(_ prefix: String) -> String {
        guard let prefixInt = Int(prefix) else {
            return "255.255.255.255"
        }
        
        // Convert CIDR prefix to subnet mask
        let mask = (0xFFFFFFFF as UInt32) << (32 - prefixInt)
        let byte1 = (mask >> 24) & 0xFF
        let byte2 = (mask >> 16) & 0xFF
        let byte3 = (mask >> 8) & 0xFF
        let byte4 = mask & 0xFF
        
        return "\(byte1).\(byte2).\(byte3).\(byte4)"
    }
}

// MARK: - Errors

enum PacketTunnelProviderError: Error, LocalizedError {
    case missingConfiguration
    case invalidConfiguration
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            return "Missing VPN configuration"
        case .invalidConfiguration:
            return "Invalid VPN configuration"
        case .unknown:
            return "Unknown error occurred"
        }
    }
}
