//
//  StatusObserverProtocol.swift
//  ShadowShuttleTemp
//
//  VPN status observer protocol
//

import Foundation

/// VPN connection status
enum VPNStatus: String {
    case disconnected = "disconnected"
    case connecting = "connecting"
    case connected = "connected"
    case disconnecting = "disconnecting"
    case reasserting = "reasserting"
    case invalid = "invalid"
}

/// VPN status change callback
typealias VPNStatusChangeCallback = (VPNStatus) -> Void

/// VPN status observer protocol
protocol StatusObserverProtocol {
    /// Start observing VPN status changes
    /// - Parameter callback: Callback to invoke when status changes
    func startObserving(callback: @escaping VPNStatusChangeCallback)
    
    /// Stop observing VPN status changes
    func stopObserving()
    
    /// Get current VPN status
    /// - Returns: Current status
    func getCurrentStatus() -> VPNStatus
}
