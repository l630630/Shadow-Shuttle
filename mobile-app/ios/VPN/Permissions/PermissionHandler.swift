//
//  PermissionHandler.swift
//  ShadowShuttleTemp
//
//  VPN permission handler implementation
//

import Foundation
import NetworkExtension

class PermissionHandler: PermissionHandlerProtocol {
    
    private let vpnManager: NETunnelProviderManager
    
    init(vpnManager: NETunnelProviderManager = NETunnelProviderManager()) {
        self.vpnManager = vpnManager
    }
    
    func checkPermission() -> VPNPermissionStatus {
        // Load VPN configurations to check permission status
        var status: VPNPermissionStatus = .notDetermined
        let semaphore = DispatchSemaphore(value: 0)
        
        NETunnelProviderManager.loadAllFromPreferences { managers, error in
            defer { semaphore.signal() }
            
            if let error = error {
                let nsError = error as NSError
                
                // Check error code to determine status
                if nsError.domain == NEVPNErrorDomain {
                    switch nsError.code {
                    case NEVPNError.configurationDisabled.rawValue:
                        status = .denied
                    case NEVPNError.configurationReadWriteFailed.rawValue:
                        status = .restricted
                    default:
                        status = .notDetermined
                    }
                } else {
                    status = .notDetermined
                }
                return
            }
            
            // If we can load managers, permission is granted
            if managers != nil {
                status = .granted
            } else {
                status = .notDetermined
            }
        }
        
        _ = semaphore.wait(timeout: .now() + 5.0)
        return status
    }
    
    func requestPermission(completion: @escaping (Result<Void, Error>) -> Void) {
        // Load existing configurations
        NETunnelProviderManager.loadAllFromPreferences { [weak self] managers, error in
            guard let self = self else {
                completion(.failure(PermissionError.unknown("Self deallocated")))
                return
            }
            
            if let error = error {
                self.handlePermissionError(error, completion: completion)
                return
            }
            
            // Use existing manager or create new one
            let manager: NETunnelProviderManager
            if let existingManager = managers?.first {
                manager = existingManager
            } else {
                manager = self.vpnManager
            }
            
            // Configure manager with minimal settings to trigger permission request
            let providerProtocol = NETunnelProviderProtocol()
            providerProtocol.providerBundleIdentifier = "com.shadowshuttle.ShadowShuttleTemp.VPNExtension"
            providerProtocol.serverAddress = "Shadow Shuttle VPN"
            
            manager.protocolConfiguration = providerProtocol
            manager.localizedDescription = "Shadow Shuttle VPN"
            manager.isEnabled = true
            
            // Save configuration (this triggers permission request)
            manager.saveToPreferences { error in
                if let error = error {
                    self.handlePermissionError(error, completion: completion)
                    return
                }
                
                // Permission granted
                completion(.success(()))
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func handlePermissionError(_ error: Error, completion: @escaping (Result<Void, Error>) -> Void) {
        let nsError = error as NSError
        
        if nsError.domain == NEVPNErrorDomain {
            switch nsError.code {
            case NEVPNError.configurationDisabled.rawValue:
                completion(.failure(PermissionError.denied))
            case NEVPNError.configurationReadWriteFailed.rawValue:
                completion(.failure(PermissionError.restricted))
            default:
                completion(.failure(PermissionError.unknown(error.localizedDescription)))
            }
        } else {
            completion(.failure(PermissionError.unknown(error.localizedDescription)))
        }
    }
}
