//
//  TunnelManagerProtocol.swift
//  ShadowShuttleTemp
//
//  VPN tunnel manager protocol
//

import Foundation

/// Tunnel manager protocol
protocol TunnelManagerProtocol {
    /// Connect to VPN with configuration
    /// - Parameters:
    ///   - configString: WireGuard configuration in INI format
    ///   - completion: Completion handler with result
    func connect(configString: String, completion: @escaping (Result<Void, Error>) -> Void)
    
    /// Disconnect from VPN
    /// - Parameter completion: Completion handler with result
    func disconnect(completion: @escaping (Result<Void, Error>) -> Void)
    
    /// Get current connection status
    /// - Returns: Current VPN status
    func getStatus() -> VPNStatus
    
    /// Start observing status changes
    /// - Parameter callback: Callback to invoke when status changes
    func observeStatus(callback: @escaping VPNStatusChangeCallback)
    
    /// Stop observing status changes
    func stopObservingStatus()
}

/// Tunnel manager errors
enum TunnelManagerError: Error, LocalizedError {
    case permissionDenied
    case invalidConfiguration(String)
    case connectionFailed(String)
    case alreadyConnected
    case notConnected
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "VPN permission denied"
        case .invalidConfiguration(let message):
            return "Invalid configuration: \(message)"
        case .connectionFailed(let message):
            return "Connection failed: \(message)"
        case .alreadyConnected:
            return "Already connected to VPN"
        case .notConnected:
            return "Not connected to VPN"
        case .unknown(let message):
            return "Unknown error: \(message)"
        }
    }
}
