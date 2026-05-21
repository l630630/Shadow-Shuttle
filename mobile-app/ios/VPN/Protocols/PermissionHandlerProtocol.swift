//
//  PermissionHandlerProtocol.swift
//  ShadowShuttleTemp
//
//  VPN permission handler protocol
//

import Foundation

/// VPN permission status
enum VPNPermissionStatus {
    case notDetermined
    case granted
    case denied
    case restricted
}

/// VPN permission handler protocol
protocol PermissionHandlerProtocol {
    /// Check current VPN permission status
    /// - Returns: Current permission status
    func checkPermission() -> VPNPermissionStatus
    
    /// Request VPN permission from user
    /// - Parameter completion: Completion handler with result
    func requestPermission(completion: @escaping (Result<Void, Error>) -> Void)
}

/// Permission handler errors
enum PermissionError: Error, LocalizedError {
    case denied
    case restricted
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .denied:
            return "VPN permission denied by user"
        case .restricted:
            return "VPN permission restricted by system"
        case .unknown(let message):
            return "Permission error: \(message)"
        }
    }
}
