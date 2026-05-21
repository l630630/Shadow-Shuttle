//
//  DIContainer.swift
//  ShadowShuttleTemp
//
//  Dependency Injection Container for iOS
//  Manages service dependencies with singleton and transient lifetimes
//

import Foundation

/// Service lifetime options
enum ServiceLifetime {
    case singleton
    case transient
}

/// Service registration information
private struct ServiceRegistration {
    let factory: (DIContainer) -> Any
    let lifetime: ServiceLifetime
    var instance: Any?
}

/// Dependency Injection Container
class DIContainer {
    private var services: [String: ServiceRegistration] = [:]
    private var resolving: Set<String> = []
    private let lock = NSLock()
    
    /// Register a service with the container
    /// - Parameters:
    ///   - type: The service type to register
    ///   - lifetime: Service lifetime (singleton or transient)
    ///   - factory: Factory closure to create the service
    func register<T>(_ type: T.Type, lifetime: ServiceLifetime = .singleton, factory: @escaping (DIContainer) -> T) {
        lock.lock()
        defer { lock.unlock() }
        
        let key = String(describing: type)
        
        guard services[key] == nil else {
            fatalError("Service '\(key)' is already registered")
        }
        
        services[key] = ServiceRegistration(
            factory: factory,
            lifetime: lifetime,
            instance: nil
        )
    }
    
    /// Resolve a service from the container
    /// - Parameter type: The service type to resolve
    /// - Returns: The resolved service instance
    func resolve<T>(_ type: T.Type) -> T {
        lock.lock()
        defer { lock.unlock() }
        
        let key = String(describing: type)
        
        guard var registration = services[key] else {
            fatalError("Service '\(key)' is not registered")
        }
        
        // Check for circular dependencies
        guard !resolving.contains(key) else {
            fatalError("Circular dependency detected for service '\(key)'")
        }
        
        // Return existing singleton instance
        if registration.lifetime == .singleton, let instance = registration.instance as? T {
            return instance
        }
        
        // Create new instance
        resolving.insert(key)
        defer { resolving.remove(key) }
        
        let instance = registration.factory(self) as! T
        
        // Cache singleton instance
        if registration.lifetime == .singleton {
            registration.instance = instance
            services[key] = registration
        }
        
        return instance
    }
    
    /// Check if a service is registered
    /// - Parameter type: The service type to check
    /// - Returns: True if the service is registered
    func has<T>(_ type: T.Type) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        
        let key = String(describing: type)
        return services[key] != nil
    }
    
    /// Clear all registered services and instances
    func clear() {
        lock.lock()
        defer { lock.unlock() }
        
        services.removeAll()
        resolving.removeAll()
    }
    
    /// Get all registered service keys
    /// - Returns: Array of registered service type names
    func getRegisteredKeys() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        
        return Array(services.keys)
    }
}

// Global container instance
let container = DIContainer()
