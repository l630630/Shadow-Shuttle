//
//  ConfigParser.swift
//  ShadowShuttleTemp
//
//  WireGuard configuration parser implementation
//

import Foundation
import NetworkExtension

class ConfigParser: ConfigParserProtocol {
    
    func parse(_ configString: String) throws -> NETunnelProviderProtocol {
        // Validate first
        let errors = validate(configString)
        if !errors.isEmpty {
            throw ConfigParserError.invalidFormat(errors.joined(separator: ", "))
        }
        
        // Parse sections
        let sections = parseSections(configString)
        
        guard let interfaceSection = sections["Interface"] else {
            throw ConfigParserError.missingRequiredField("Interface")
        }
        
        // Parse interface configuration
        let interfaceConfig = try parseInterface(interfaceSection)
        
        // Parse peer configurations
        var peersConfig: [[String: String]] = []
        for (key, value) in sections where key.hasPrefix("Peer") {
            let peerConfig = try parsePeer(value)
            peersConfig.append(peerConfig)
        }
        
        // Create tunnel configuration
        let tunnelConfig = NETunnelProviderProtocol()
        tunnelConfig.providerBundleIdentifier = "com.shadowshuttle.ShadowShuttleTemp.VPNExtension"
        tunnelConfig.serverAddress = interfaceConfig["Address"] ?? "Unknown"
        
        // Store full configuration in providerConfiguration
        var providerConfig: [String: Any] = [:]
        providerConfig["interface"] = interfaceConfig
        providerConfig["peers"] = peersConfig
        providerConfig["configString"] = configString
        
        tunnelConfig.providerConfiguration = providerConfig
        
        return tunnelConfig
    }
    
    func validate(_ configString: String) -> [String] {
        var errors: [String] = []
        
        // Check if empty
        if configString.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errors.append("Configuration is empty")
            return errors
        }
        
        // Parse sections
        let sections = parseSections(configString)
        
        // Check for Interface section
        guard let interfaceSection = sections["Interface"] else {
            errors.append("Missing [Interface] section")
            return errors
        }
        
        // Validate Interface fields
        let interfaceFields = parseFields(interfaceSection)
        
        if interfaceFields["PrivateKey"] == nil {
            errors.append("Missing PrivateKey in [Interface]")
        }
        
        if interfaceFields["Address"] == nil {
            errors.append("Missing Address in [Interface]")
        }
        
        // Check for at least one Peer section
        let peerSections = sections.filter { $0.key.hasPrefix("Peer") }
        if peerSections.isEmpty {
            errors.append("Missing [Peer] section")
            return errors
        }
        
        // Validate each Peer
        for (_, peerSection) in peerSections {
            let peerFields = parseFields(peerSection)
            
            if peerFields["PublicKey"] == nil {
                errors.append("Missing PublicKey in [Peer]")
            }
            
            if peerFields["Endpoint"] == nil {
                errors.append("Missing Endpoint in [Peer]")
            }
            
            if peerFields["AllowedIPs"] == nil {
                errors.append("Missing AllowedIPs in [Peer]")
            }
        }
        
        return errors
    }
    
    // MARK: - Private Methods
    
    private func parseSections(_ configString: String) -> [String: String] {
        var sections: [String: String] = [:]
        var currentSection: String?
        var currentContent: [String] = []
        
        let lines = configString.components(separatedBy: .newlines)
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            
            // Skip empty lines and comments
            if trimmed.isEmpty || trimmed.hasPrefix("#") {
                continue
            }
            
            // Check for section header
            if trimmed.hasPrefix("[") && trimmed.hasSuffix("]") {
                // Save previous section
                if let section = currentSection {
                    sections[section] = currentContent.joined(separator: "\n")
                }
                
                // Start new section
                let sectionName = String(trimmed.dropFirst().dropLast())
                currentSection = sectionName
                currentContent = []
            } else {
                // Add line to current section
                currentContent.append(trimmed)
            }
        }
        
        // Save last section
        if let section = currentSection {
            sections[section] = currentContent.joined(separator: "\n")
        }
        
        return sections
    }
    
    private func parseFields(_ sectionContent: String) -> [String: String] {
        var fields: [String: String] = [:]
        
        let lines = sectionContent.components(separatedBy: .newlines)
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            
            if trimmed.isEmpty || trimmed.hasPrefix("#") {
                continue
            }
            
            // Split by = or :
            let parts = trimmed.components(separatedBy: "=")
            if parts.count == 2 {
                let key = parts[0].trimmingCharacters(in: .whitespaces)
                let value = parts[1].trimmingCharacters(in: .whitespaces)
                fields[key] = value
            }
        }
        
        return fields
    }
    
    private func parseInterface(_ sectionContent: String) throws -> [String: String] {
        let fields = parseFields(sectionContent)
        
        guard let privateKey = fields["PrivateKey"] else {
            throw ConfigParserError.missingRequiredField("PrivateKey")
        }
        
        guard let address = fields["Address"] else {
            throw ConfigParserError.missingRequiredField("Address")
        }
        
        var config: [String: String] = [:]
        config["PrivateKey"] = privateKey
        config["Address"] = address
        
        if let dns = fields["DNS"] {
            config["DNS"] = dns
        }
        
        if let mtu = fields["MTU"] {
            config["MTU"] = mtu
        }
        
        return config
    }
    
    private func parsePeer(_ sectionContent: String) throws -> [String: String] {
        let fields = parseFields(sectionContent)
        
        guard let publicKey = fields["PublicKey"] else {
            throw ConfigParserError.missingRequiredField("PublicKey")
        }
        
        guard let endpoint = fields["Endpoint"] else {
            throw ConfigParserError.missingRequiredField("Endpoint")
        }
        
        guard let allowedIPs = fields["AllowedIPs"] else {
            throw ConfigParserError.missingRequiredField("AllowedIPs")
        }
        
        var config: [String: String] = [:]
        config["PublicKey"] = publicKey
        config["Endpoint"] = endpoint
        config["AllowedIPs"] = allowedIPs
        
        if let presharedKey = fields["PresharedKey"] {
            config["PresharedKey"] = presharedKey
        }
        
        if let keepalive = fields["PersistentKeepalive"] {
            config["PersistentKeepalive"] = keepalive
        }
        
        return config
    }
}
