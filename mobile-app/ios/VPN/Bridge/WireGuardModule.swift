//
//  WireGuardModule.swift
//  ShadowShuttleTemp
//
//  React Native bridge for WireGuard VPN
//

import Foundation
import React

@objc(WireGuardModule)
class WireGuardModule: RCTEventEmitter {
    
    private var tunnelManager: TunnelManagerProtocol?
    private var hasListeners = false
    
    override init() {
        super.init()
        setupTunnelManager()
    }
    
    // MARK: - React Native Methods
    
    @objc
    func connect(_ configString: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let manager = tunnelManager else {
            rejecter("ERROR", "Tunnel manager not initialized", nil)
            return
        }
        
        manager.connect(configString: configString) { result in
            switch result {
            case .success:
                resolver(nil)
            case .failure(let error):
                rejecter("CONNECT_ERROR", error.localizedDescription, error)
            }
        }
    }
    
    @objc
    func disconnect(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let manager = tunnelManager else {
            rejecter("ERROR", "Tunnel manager not initialized", nil)
            return
        }
        
        manager.disconnect { result in
            switch result {
            case .success:
                resolver(nil)
            case .failure(let error):
                rejecter("DISCONNECT_ERROR", error.localizedDescription, error)
            }
        }
    }
    
    @objc
    func getStatus(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let manager = tunnelManager else {
            rejecter("ERROR", "Tunnel manager not initialized", nil)
            return
        }
        
        let status = manager.getStatus()
        resolver(status.rawValue)
    }
    
    // MARK: - Event Emitter
    
    override func startObserving() {
        hasListeners = true
        
        tunnelManager?.observeStatus { [weak self] status in
            guard let self = self, self.hasListeners else { return }
            
            self.sendEvent(withName: "onStatusChange", body: [
                "status": status.rawValue
            ])
        }
    }
    
    override func stopObserving() {
        hasListeners = false
        tunnelManager?.stopObservingStatus()
    }
    
    override func supportedEvents() -> [String]! {
        return ["onStatusChange"]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Private Methods
    
    private func setupTunnelManager() {
        // Get dependencies from DI container
        guard let container = DIContainer.shared else {
            print("DI Container not initialized")
            return
        }
        
        do {
            let configParser = try container.resolve(ConfigParserProtocol.self)
            let permissionHandler = try container.resolve(PermissionHandlerProtocol.self)
            let statusObserver = try container.resolve(StatusObserverProtocol.self)
            
            tunnelManager = TunnelManager(
                configParser: configParser,
                permissionHandler: permissionHandler,
                statusObserver: statusObserver
            )
        } catch {
            print("Failed to setup tunnel manager: \(error.localizedDescription)")
            
            // Fallback to direct initialization
            let configParser = ConfigParser()
            let permissionHandler = PermissionHandler()
            let statusObserver = StatusObserver()
            
            tunnelManager = TunnelManager(
                configParser: configParser,
                permissionHandler: permissionHandler,
                statusObserver: statusObserver
            )
        }
    }
}
