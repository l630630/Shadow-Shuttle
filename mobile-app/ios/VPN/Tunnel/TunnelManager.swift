//
//  TunnelManager.swift
//  ShadowShuttleTemp
//
//  VPN tunnel manager implementation
//

import Foundation
import NetworkExtension

class TunnelManager: TunnelManagerProtocol {
    
    private let configParser: ConfigParserProtocol
    private let permissionHandler: PermissionHandlerProtocol
    private let statusObserver: StatusObserverProtocol
    
    private var vpnManager: NETunnelProviderManager?
    
    init(
        configParser: ConfigParserProtocol,
        permissionHandler: PermissionHandlerProtocol,
        statusObserver: StatusObserverProtocol
    ) {
        self.configParser = configParser
        self.permissionHandler = permissionHandler
        self.statusObserver = statusObserver
        
        loadVPNManager()
    }
    
    func connect(configString: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // Check if already connected
        let currentStatus = getStatus()
        if currentStatus == .connected || currentStatus == .connecting {
            completion(.failure(TunnelManagerError.alreadyConnected))
            return
        }
        
        // Validate configuration
        let validationErrors = configParser.validate(configString)
        if !validationErrors.isEmpty {
            let errorMessage = validationErrors.joined(separator: ", ")
            completion(.failure(TunnelManagerError.invalidConfiguration(errorMessage)))
            return
        }
        
        // Check permission
        let permissionStatus = permissionHandler.checkPermission()
        if permissionStatus == .denied || permissionStatus == .restricted {
            completion(.failure(TunnelManagerError.permissionDenied))
            return
        }
        
        // Request permission if needed
        if permissionStatus == .notDetermined {
            permissionHandler.requestPermission { [weak self] result in
                switch result {
                case .success:
                    self?.performConnect(configString: configString, completion: completion)
                case .failure(let error):
                    completion(.failure(error))
                }
            }
        } else {
            performConnect(configString: configString, completion: completion)
        }
    }
    
    func disconnect(completion: @escaping (Result<Void, Error>) -> Void) {
        guard let manager = vpnManager else {
            completion(.failure(TunnelManagerError.notConnected))
            return
        }
        
        let currentStatus = getStatus()
        if currentStatus == .disconnected || currentStatus == .invalid {
            completion(.failure(TunnelManagerError.notConnected))
            return
        }
        
        manager.connection.stopVPNTunnel()
        
        // Wait a bit for disconnection
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else {
                completion(.failure(TunnelManagerError.unknown("Self deallocated")))
                return
            }
            
            let status = self.getStatus()
            if status == .disconnected {
                completion(.success(()))
            } else {
                completion(.failure(TunnelManagerError.connectionFailed("Failed to disconnect")))
            }
        }
    }
    
    func getStatus() -> VPNStatus {
        return statusObserver.getCurrentStatus()
    }
    
    func observeStatus(callback: @escaping VPNStatusChangeCallback) {
        statusObserver.startObserving(callback: callback)
    }
    
    func stopObservingStatus() {
        statusObserver.stopObserving()
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
    
    private func performConnect(configString: String, completion: @escaping (Result<Void, Error>) -> Void) {
        // Parse configuration
        let tunnelConfig: NETunnelProviderProtocol
        do {
            tunnelConfig = try configParser.parse(configString)
        } catch {
            completion(.failure(TunnelManagerError.invalidConfiguration(error.localizedDescription)))
            return
        }
        
        // Load or create manager
        NETunnelProviderManager.loadAllFromPreferences { [weak self] managers, error in
            guard let self = self else {
                completion(.failure(TunnelManagerError.unknown("Self deallocated")))
                return
            }
            
            if let error = error {
                completion(.failure(TunnelManagerError.connectionFailed(error.localizedDescription)))
                return
            }
            
            // Use existing manager or create new one
            let manager: NETunnelProviderManager
            if let existingManager = managers?.first {
                manager = existingManager
            } else {
                manager = NETunnelProviderManager()
            }
            
            // Configure manager
            manager.protocolConfiguration = tunnelConfig
            manager.localizedDescription = "Shadow Shuttle VPN"
            manager.isEnabled = true
            
            // Save configuration
            manager.saveToPreferences { error in
                if let error = error {
                    completion(.failure(TunnelManagerError.connectionFailed(error.localizedDescription)))
                    return
                }
                
                // Reload to get updated manager
                manager.loadFromPreferences { error in
                    if let error = error {
                        completion(.failure(TunnelManagerError.connectionFailed(error.localizedDescription)))
                        return
                    }
                    
                    // Store manager reference
                    self.vpnManager = manager
                    
                    // Start VPN connection
                    do {
                        try manager.connection.startVPNTunnel()
                        completion(.success(()))
                    } catch {
                        completion(.failure(TunnelManagerError.connectionFailed(error.localizedDescription)))
                    }
                }
            }
        }
    }
}
