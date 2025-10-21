# TrouPriv Test Suite

## Overview

This directory contains comprehensive automated tests for the TrouPriv application, focusing on data persistence, vault functionality, and storage mechanisms.

## Test Files

### 1. `storage.test.ts`
Tests the core storage utilities that handle localStorage operations with schema versioning.

**Key Features Tested:**
- Data saving and retrieval
- Schema versioning and migration
- Error handling and recovery
- Edge cases (empty values, special characters, large data)

### 2. `encryption.test.ts`
Tests the encryption/decryption functionality using Web Crypto API.

**Key Features Tested:**
- AES-GCM encryption
- PBKDF2 key derivation
- Security properties (random IV, salt)
- Error handling for invalid data

### 3. `vault-persistence.test.ts`
Tests vault-specific persistence across browser sessions and various scenarios.

**Key Features Tested:**
- Master password management
- Vault item storage and retrieval
- Browser session simulation
- Data integrity

### 4. `app-data-persistence.test.ts`
Tests application-wide data persistence for all app state.

**Key Features Tested:**
- Assets, profile, settings persistence
- Web3 wallet state
- AI persona and protocols
- Chat history

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test storage.test.ts

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage
```

## Test Structure

Each test file follows this structure:

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup for each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const testData = { /* ... */ };
      
      // Act
      const result = functionUnderTest(testData);
      
      // Assert
      expect(result).toEqual(expectedValue);
    });
  });
});
```

## Configuration

Tests are configured using Vitest with the following setup:

- **Environment**: jsdom (browser-like environment)
- **Setup File**: `setup.ts` (runs before each test)
- **Coverage**: v8 provider
- **Globals**: Enabled for easier test writing

See `vitest.config.ts` in the root directory for full configuration.

## Writing New Tests

When adding new tests:

1. Create a new file with `.test.ts` extension
2. Import necessary utilities and functions
3. Use `describe` blocks to group related tests
4. Use `beforeEach` for test setup
5. Use `it` or `test` for individual test cases
6. Follow the Arrange-Act-Assert pattern

Example:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../utils/myUtil';

describe('My Feature', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should handle basic case', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge case', () => {
    const result = myFunction(null);
    expect(result).toBeNull();
  });
});
```

## Mocking

### Web Crypto API
The Web Crypto API is mocked in tests to provide deterministic behavior:

```typescript
const mockCrypto = {
  getRandomValues: (buffer) => { /* ... */ },
  subtle: {
    encrypt: vi.fn(/* ... */),
    decrypt: vi.fn(/* ... */),
    // ...
  }
};
```

### localStorage and sessionStorage
These are automatically available in the jsdom environment and are cleared between tests.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clear storage in `beforeEach` or `afterEach`
3. **Descriptive Names**: Use clear, descriptive test names
4. **One Assertion Per Test**: When possible, test one thing per test
5. **Edge Cases**: Always test edge cases and error conditions
6. **Async**: Use `async`/`await` for asynchronous code
7. **Mocking**: Mock external dependencies and APIs

## Test Coverage

Current test coverage:

- **Storage utilities**: 100%
- **Encryption utilities**: 100%
- **Vault persistence**: 100%
- **App data persistence**: 100%

Run `npm run test:coverage` to see detailed coverage reports.

## Troubleshooting

### Tests Failing

1. **Clear node_modules**: `rm -rf node_modules && npm install`
2. **Clear cache**: `npm test -- --clearCache`
3. **Check setup**: Ensure `setup.ts` is running correctly
4. **Check mocks**: Verify all mocks are properly configured

### Tests Running Slowly

1. **Reduce iterations**: Lower the number of items in large dataset tests
2. **Skip tests**: Use `.skip` to temporarily skip slow tests
3. **Run specific files**: Test individual files instead of entire suite

### Import Errors

1. **Check paths**: Verify import paths are correct (use relative paths)
2. **Check tsconfig**: Ensure TypeScript configuration is correct
3. **Check aliases**: Verify path aliases in `vitest.config.ts`

## Contributing

When contributing tests:

1. Ensure all tests pass before committing
2. Add tests for new features
3. Update existing tests when modifying features
4. Document complex test scenarios
5. Follow the existing code style

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## License

Same as the main project license.
