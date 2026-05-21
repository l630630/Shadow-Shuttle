# Core Module

## DIContainer

A lightweight Dependency Injection (DI) container for managing service dependencies in the Shadow Shuttle mobile app.

### Features

- ✅ Singleton and transient service lifetimes
- ✅ Circular dependency detection
- ✅ Type-safe service resolution
- ✅ Thread-safe (iOS Swift implementation)
- ✅ Simple and intuitive API

### Usage

#### Basic Registration and Resolution

```typescript
import { container } from './core/DIContainer';

// Define a service
class DatabaseService {
  query(sql: string) {
    return 'result';
  }
}

// Register as singleton (default)
container.register('DatabaseService', () => new DatabaseService());

// Resolve the service
const db = container.resolve<DatabaseService>('DatabaseService');
```

#### Transient Services

```typescript
// Register as transient (new instance each time)
container.register('RequestService', () => new RequestService(), 'transient');

const req1 = container.resolve<RequestService>('RequestService');
const req2 = container.resolve<RequestService>('RequestService');
// req1 !== req2
```

#### Dependency Injection

```typescript
class UserService {
  constructor(private db: DatabaseService) {}
  
  getUser(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Register with dependencies
container.register('DatabaseService', () => new DatabaseService());
container.register('UserService', (c) => {
  const db = c.resolve<DatabaseService>('DatabaseService');
  return new UserService(db);
});

// Resolve with all dependencies injected
const userService = container.resolve<UserService>('UserService');
```

#### Complex Dependency Chains

```typescript
// ServiceA has no dependencies
container.register('ServiceA', () => new ServiceA());

// ServiceB depends on ServiceA
container.register('ServiceB', (c) => {
  const serviceA = c.resolve<ServiceA>('ServiceA');
  return new ServiceB(serviceA);
});

// ServiceC depends on ServiceB (which depends on ServiceA)
container.register('ServiceC', (c) => {
  const serviceB = c.resolve<ServiceB>('ServiceB');
  return new ServiceC(serviceB);
});

// All dependencies are automatically resolved
const serviceC = container.resolve<ServiceC>('ServiceC');
```

### iOS Swift Usage

```swift
import Foundation

// Define a protocol
protocol DatabaseService {
    func query(_ sql: String) -> String
}

// Implement the service
class SQLiteDatabaseService: DatabaseService {
    func query(_ sql: String) -> String {
        return "result"
    }
}

// Register the service
container.register(DatabaseService.self) { _ in
    SQLiteDatabaseService()
}

// Resolve the service
let db = container.resolve(DatabaseService.self)
```

### Best Practices

1. **Use interfaces/protocols**: Register services by their interface, not concrete implementation
   ```typescript
   // Good
   container.register('IHttpClient', () => new FetchHttpClient());
   
   // Avoid
   container.register('FetchHttpClient', () => new FetchHttpClient());
   ```

2. **Register at app startup**: Register all services in a centralized location
   ```typescript
   // src/core/registerServices.ts
   export function registerServices() {
     container.register('IHttpClient', () => new FetchHttpClient());
     container.register('IConfigManager', (c) => {
       const storage = c.resolve<ISecureStorage>('ISecureStorage');
       return new ConfigManager(storage);
     });
     // ... more registrations
   }
   ```

3. **Use singleton for stateful services**: Database connections, configuration managers, etc.
   ```typescript
   container.register('ConfigManager', () => new ConfigManager(), 'singleton');
   ```

4. **Use transient for stateless services**: Request handlers, validators, etc.
   ```typescript
   container.register('RequestValidator', () => new RequestValidator(), 'transient');
   ```

5. **Avoid circular dependencies**: Design your services to have clear dependency hierarchies

### Error Handling

The container will throw errors in the following cases:

- **Duplicate registration**: Attempting to register a service that's already registered
- **Unregistered service**: Attempting to resolve a service that hasn't been registered
- **Circular dependency**: Services that depend on each other directly or indirectly

```typescript
try {
  const service = container.resolve<MyService>('MyService');
} catch (error) {
  console.error('Failed to resolve service:', error.message);
}
```

### Testing

The container is fully tested with:
- ✅ Service registration and resolution
- ✅ Circular dependency detection
- ✅ Singleton pattern verification
- ✅ Transient service creation
- ✅ Complex dependency chains

Run tests:
```bash
npm test -- src/core/__tests__/DIContainer.test.ts
```

### API Reference

#### TypeScript

```typescript
class DIContainer {
  // Register a service
  register<T>(key: string, factory: (container: DIContainer) => T, lifetime?: 'singleton' | 'transient'): void
  
  // Resolve a service
  resolve<T>(key: string): T
  
  // Check if service is registered
  has(key: string): boolean
  
  // Clear all services
  clear(): void
  
  // Get all registered keys
  getRegisteredKeys(): string[]
}
```

#### Swift

```swift
class DIContainer {
  // Register a service
  func register<T>(_ type: T.Type, lifetime: ServiceLifetime = .singleton, factory: @escaping (DIContainer) -> T)
  
  // Resolve a service
  func resolve<T>(_ type: T.Type) -> T
  
  // Check if service is registered
  func has<T>(_ type: T.Type) -> Bool
  
  // Clear all services
  func clear()
  
  // Get all registered keys
  func getRegisteredKeys() -> [String]
}
```
