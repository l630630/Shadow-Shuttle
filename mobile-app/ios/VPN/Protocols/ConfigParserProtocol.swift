//
//  ConfigParserProtocol.swift
//  ShadowShuttleTemp
//
//  WireGuard configuration parser protocol
//

import Foundation
import NetworkExtension

/// WireGuard configuration parser protocol
protocol ConfigParserProtocol {
    /// Parse WireGuard INI format string to TunnelConfiguration
    /// - Parameter configString: WireGuard configuration in INI format
    /// - Returns: Parsed tunnel configuration
    /// - Throws: ConfigParserError if parsing fails
    func parse(_ configString: String) throws -> NETunnelProviderProtocol
    
    /// Validate configuration string format
    /// - Parameter configString: Configuration string to validate
    /// - Returns: Array of validation errors (empty if valid)
    func validate(_ configString: String) -> [String]
}

/// Configuration parser errors
enum ConfigParserError: Error, LocalizedError {
    case invalidFormat(String)
    case missingRequiredField(String)
    case invalidValue(field: String, value: String)
    case parseError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidFormat(let message):
            return "Invalid configuration format: \(message)"
        case .missingRequiredField(let field):
            return "Missing required field: \(field)"
        case .invalidValue(let field, let value):
            return "Invalid value for \(field): \(value)"
        case .parseError(let message):
            return "Parse error: \(message)"
        }
    }
}
