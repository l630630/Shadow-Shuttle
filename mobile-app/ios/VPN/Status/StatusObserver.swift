//
//  StatusObserver.swift
//  ShadowShuttleTemp
//
//  VPN status observer implementation
//

import Foundation
import NetworkExtension

class StatusObserver: StatusObserverProtocol {
    
    private var vpnManager: NETunnelProviderManager?
    private var statusCallback: VPNStatusChangeCallback?
    private var isObserving = false
    
    init() {
        loadVPNManager()
    }
    
    deinit {
        stopObserving()
    }
    
    func startObserving(callback: @escaping VPNStatusChangeCallback) {
        self.statusCallback = callback
        
        if !isObserving {
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(vpnStatusDidChange),
                name: .NEVPNStatusDidChange,
                object: nil
            )
            isObserving = true
        }
        
        // Send initial status
        let currentStatus = getCurrentStatus()
        callback(currentStatus)
    }
    
    func stopObserving() {
        if isObserving {
            NotificationCenter.default.removeObserver(
                self,
                name: .NEVPNStatusDidChange,
                object: nil
            )
            isObserving = false
        }
        statusCallback = nil
    }
    
    func getCurrentStatus() -> VPNStatus {
        guard let manager = vpnManager else {
            return .invalid
        }
        
        return convertStatus(manager.connection.status)
    }
    
    // MARK: - Private Methods
    
    private func loadVPNManager() {
        NETunnelProviderManager.loadAllFromPreferences { [weak self] managers, error in
            guard let self = self else { return }
            
            if let error = error {
                print("Failed to load VPN manager: \(error.localizedDescription)")
                return
            }
            
            self.vpnManager = managers?.first
        }
    }
    
    @objc private func vpnStatusDidChange(_ notification: Notification) {
        guard let connection = notification.object as? NEVPNConnection else {
            return
        }
        
        let status = convertStatus(connection.status)
        statusCallback?(status)
    }
    
    private func convertStatus(_ neStatus: NEVPNStatus) -> VPNStatus {
        switch neStatus {
        case .invalid:
            return .invalid
        case .disconnected:
            return .disconnected
        case .connecting:
            return .connecting
        case .connected:
            return .connected
        case .reasserting:
            return .reasserting
        case .disconnecting:
            return .disconnecting
        @unknown default:
            return .invalid
        }
    }
}
