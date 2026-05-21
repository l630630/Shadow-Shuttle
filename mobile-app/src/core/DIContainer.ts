/**
 * Dependency Injection Container
 * 
 * A lightweight DI container for managing service dependencies.
 * Supports singleton and transient service lifetimes.
 */

type ServiceFactory<T> = (container: DIContainer) => T;
type ServiceLifetime = 'singleton' | 'transient';

interface ServiceRegistration<T> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

export class DIContainer {
  private services = new Map<string, ServiceRegistration<any>>();
  private resolving = new Set<string>();

  /**
   * Register a service with the container
   * @param key - Unique identifier for the service
   * @param factory - Factory function to create the service
   * @param lifetime - Service lifetime (singleton or transient)
   */
  register<T>(
    key: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    if (this.services.has(key)) {
      throw new Error(`Service '${key}' is already registered`);
    }

    this.services.set(key, { factory, lifetime });
  }

  /**
   * Resolve a service from the container
   * @param key - Unique identifier for the service
   * @returns The resolved service instance
   */
  resolve<T>(key: string): T {
    const registration = this.services.get(key);

    if (!registration) {
      throw new Error(`Service '${key}' is not registered`);
    }

    // Check for circular dependencies
    if (this.resolving.has(key)) {
      throw new Error(`Circular dependency detected for service '${key}'`);
    }

    // Return existing singleton instance
    if (registration.lifetime === 'singleton' && registration.instance) {
      return registration.instance as T;
    }

    // Create new instance
    this.resolving.add(key);
    try {
      const instance = registration.factory(this);

      // Cache singleton instance
      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(key);
    }
  }

  /**
   * Check if a service is registered
   * @param key - Unique identifier for the service
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Clear all registered services and instances
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.services.keys());
  }
}

// Global container instance
export const container = new DIContainer();
