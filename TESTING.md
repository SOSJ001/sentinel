# Solana Forensics MVP - Testing Guide

## Overview

This testing environment is designed to run completely independently from your development server (`npm run dev`). You can run tests while your development server is running without any interference.

## Test Commands

### Basic Testing

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Advanced Testing

```bash
# Run specific test suites
npm run test -- --grep="unit"
npm run test -- --grep="integration"
npm run test -- --grep="forensics"

# Run tests for specific files
npm run test -- src/lib/services/solana.service.test.ts

# Run tests with specific reporter
npm run test -- --reporter=verbose
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── mocks/                 # Mock implementations
│   │   └── solana.mock.ts     # Solana-specific mocks
│   └── config/
│       └── test.env.ts        # Test environment config
├── lib/
│   ├── services/
│   │   └── *.service.test.ts  # Service tests
│   └── components/
│       └── *.component.test.ts # Component tests
```

## Test Categories

### 1. Unit Tests

- **Purpose**: Test individual functions and components in isolation
- **Scope**: Services, utilities, pure functions
- **Speed**: Fast (< 1 second per test)
- **Dependencies**: Mocked

### 2. Integration Tests

- **Purpose**: Test interactions between services
- **Scope**: Service integration, data flow
- **Speed**: Medium (1-5 seconds per test)
- **Dependencies**: Mocked with realistic data

### 3. Forensics Tests

- **Purpose**: Test forensics-specific features
- **Scope**: Evidence integrity, chain of custody, audit trails
- **Speed**: Medium (2-10 seconds per test)
- **Dependencies**: Mocked forensics data

### 4. Performance Tests

- **Purpose**: Test system performance under load
- **Scope**: High transaction volume, memory usage
- **Speed**: Slow (10+ seconds per test)
- **Dependencies**: Realistic test data

## Running Tests During Development

### Option 1: Separate Terminal

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Tests
npm run test:watch
```

### Option 2: Test UI

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Test UI
npm run test:ui
```

### Option 3: One-time Tests

```bash
# Run tests when needed
npm run test:run
```

## Test Configuration

### Environment Variables

```bash
# Test environment (automatically set)
NODE_ENV=test
VITEST=true

# Optional: Override test endpoints
TEST_SOLANA_RPC=https://api.devnet.solana.com
TEST_SOLANA_WS=wss://api.devnet.solana.com
```

### Mock Configuration

- **Solana Web3.js**: Fully mocked for unit tests
- **WebSocket**: Mocked for connection testing
- **Node Notifier**: Mocked for alert testing
- **File System**: Mocked for evidence storage testing

## Writing Tests

### Service Tests

```typescript
// src/lib/services/validation.service.test.ts
import { describe, it, expect } from 'vitest';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
	it('should validate high-value transactions', () => {
		const service = new ValidationService();
		const result = service.validateTransaction({
			amount: 150, // SOL
			timestamp: Date.now()
		});

		expect(result.isSuspicious).toBe(true);
		expect(result.reason).toContain('high value');
	});
});
```

### Component Tests

```typescript
// src/lib/components/WalletMonitor.test.ts
import { render, screen } from '@testing-library/svelte';
import WalletMonitor from './WalletMonitor.svelte';

describe('WalletMonitor', () => {
	it('should render wallet input field', () => {
		render(WalletMonitor);
		expect(screen.getByPlaceholderText('Enter wallet address')).toBeInTheDocument();
	});
});
```

## Test Data

### Mock Transactions

```typescript
// Use predefined test data
import { testConfig } from '../test/config/test.env';

const testTransaction = testConfig.testTransactions[0];
```

### Real Test Data (Devnet)

```typescript
// Use Solana devnet for realistic testing
const devnetConnection = new Connection('https://api.devnet.solana.com');
```

## Continuous Integration

### GitHub Actions (Optional)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Tests not running**: Check if `vitest.config.ts` exists
2. **Mock errors**: Verify mock setup in `src/test/setup.ts`
3. **Import errors**: Check file paths and extensions
4. **Timeout errors**: Increase timeout in `vitest.config.ts`

### Debug Mode

```bash
# Run tests with debug output
npm run test -- --reporter=verbose --no-coverage
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Don't make real API calls in tests
3. **Test Edge Cases**: Include error conditions and boundary values
4. **Keep Tests Fast**: Unit tests should run in milliseconds
5. **Descriptive Names**: Use clear, descriptive test names
6. **One Assertion Per Test**: Focus on testing one thing at a time

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **Forensics Tests**: 100% coverage for critical paths
- **Performance Tests**: Key scenarios covered

## Next Steps

1. **Start with Unit Tests**: Test your core services first
2. **Add Integration Tests**: Test service interactions
3. **Implement Forensics Tests**: Test evidence handling
4. **Add Performance Tests**: Test under load
5. **Set up CI/CD**: Automate testing in your deployment pipeline
