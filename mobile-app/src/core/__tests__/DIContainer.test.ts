/**
 * Unit tests for DIContainer
 * Tests service registration, resolution, circular dependency detection, and singleton pattern
 */

import { DIContainer } from '../DIContainer';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Service Registration and Resolution', () => {
    it('should register and resolve a singleton service', () => {
      // Arrange
      class TestService {
        value = 42;
      }

      // Act
      container.register('TestService', () => new TestService(), 'singleton');
      const instance1 = container.resolve<TestService>('TestService');
      const instance2 = container.resolve<TestService>('TestService');

      // Assert
      expect(instance1).toBeDefined();
      expect(instance1.value).toBe(42);
      expect(instance1).toBe(instance2); // Same instance
    });

    it('should register and resolve a transient service', () => {
      // Arrange
      class TestService {
        value = Math.random();
      }

      // Act
      container.register('TestService', () => new TestService(), 'transient');
      const instance1 = container.resolve<TestService>('TestService');
      const instance2 = container.resolve<TestService>('TestService');

      // Assert
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).not.toBe(instance2); // Different instances
    });

    it('should throw error when registering duplicate service', () => {
      // Arrange
      class TestService {}
      container.register('TestService', () => new TestService());

      // Act & Assert
      expect(() => {
        container.register('TestService', () => new TestService());
      }).toThrow("Service 'TestService' is already registered");
    });

    it('should throw error when resolving unregistered service', () => {
      // Act & Assert
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow("Service 'NonExistentService' is not registered");
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect direct circular dependency', () => {
      // Arrange
      container.register('ServiceA', (c) => {
        return { b: c.resolve('ServiceA') }; // Self-reference
      });

      // Act & Assert
      expect(() => {
        container.resolve('ServiceA');
      }).toThrow("Circular dependency detected for service 'ServiceA'");
    });

    it('should detect indirect circular dependency', () => {
      // Arrange
      container.register('ServiceA', (c) => {
        return { b: c.resolve('ServiceB') };
      });

      container.register('ServiceB', (c) => {
        return { a: c.resolve('ServiceA') }; // Circular reference
      });

      // Act & Assert
      expect(() => {
        container.resolve('ServiceA');
      }).toThrow(/Circular dependency detected/);
    });

    it('should allow resolving after circular dependency error', () => {
      // Arrange
      container.register('ServiceA', (c) => {
        return { b: c.resolve('ServiceA') };
      });

      container.register('ServiceB', () => ({ value: 'test' }));

      // Act
      try {
        container.resolve('ServiceA');
      } catch (e) {
        // Expected error
      }

      const serviceB = container.resolve('ServiceB');

      // Assert
      expect(serviceB).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for singleton services', () => {
      // Arrange
      let instanceCount = 0;
      class TestService {
        id: number;
        constructor() {
          this.id = ++instanceCount;
        }
      }

      // Act
      container.register('TestService', () => new TestService(), 'singleton');
      const instance1 = container.resolve<TestService>('TestService');
      const instance2 = container.resolve<TestService>('TestService');
      const instance3 = container.resolve<TestService>('TestService');

      // Assert
      expect(instanceCount).toBe(1); // Only created once
      expect(instance1.id).toBe(1);
      expect(instance2.id).toBe(1);
      expect(instance3.id).toBe(1);
    });

    it('should create new instance for transient services', () => {
      // Arrange
      let instanceCount = 0;
      class TestService {
        id: number;
        constructor() {
          this.id = ++instanceCount;
        }
      }

      // Act
      container.register('TestService', () => new TestService(), 'transient');
      const instance1 = container.resolve<TestService>('TestService');
      const instance2 = container.resolve<TestService>('TestService');
      const instance3 = container.resolve<TestService>('TestService');

      // Assert
      expect(instanceCount).toBe(3); // Created three times
      expect(instance1.id).toBe(1);
      expect(instance2.id).toBe(2);
      expect(instance3.id).toBe(3);
    });
  });

  describe('Container Management', () => {
    it('should check if service is registered', () => {
      // Arrange
      class TestService {}
      container.register('TestService', () => new TestService());

      // Act & Assert
      expect(container.has('TestService')).toBe(true);
      expect(container.has('NonExistent')).toBe(false);
    });

    it('should clear all services', () => {
      // Arrange
      class ServiceA {}
      class ServiceB {}
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());

      // Act
      container.clear();

      // Assert
      expect(container.has('ServiceA')).toBe(false);
      expect(container.has('ServiceB')).toBe(false);
      expect(container.getRegisteredKeys()).toHaveLength(0);
    });

    it('should get all registered keys', () => {
      // Arrange
      class ServiceA {}
      class ServiceB {}
      class ServiceC {}
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());
      container.register('ServiceC', () => new ServiceC());

      // Act
      const keys = container.getRegisteredKeys();

      // Assert
      expect(keys).toHaveLength(3);
      expect(keys).toContain('ServiceA');
      expect(keys).toContain('ServiceB');
      expect(keys).toContain('ServiceC');
    });
  });

  describe('Dependency Injection', () => {
    it('should inject dependencies correctly', () => {
      // Arrange
      class DatabaseService {
        query() {
          return 'data';
        }
      }

      class UserService {
        constructor(private db: DatabaseService) {}
        getUser() {
          return this.db.query();
        }
      }

      // Act
      container.register('DatabaseService', () => new DatabaseService());
      container.register('UserService', (c) => {
        const db = c.resolve<DatabaseService>('DatabaseService');
        return new UserService(db);
      });

      const userService = container.resolve<UserService>('UserService');

      // Assert
      expect(userService.getUser()).toBe('data');
    });

    it('should handle complex dependency chains', () => {
      // Arrange
      class ServiceA {
        name = 'A';
      }
      class ServiceB {
        constructor(public a: ServiceA) {}
      }
      class ServiceC {
        constructor(public b: ServiceB) {}
      }

      // Act
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', (c) => new ServiceB(c.resolve('ServiceA')));
      container.register('ServiceC', (c) => new ServiceC(c.resolve('ServiceB')));

      const serviceC = container.resolve<ServiceC>('ServiceC');

      // Assert
      expect(serviceC.b.a.name).toBe('A');
    });
  });
});
