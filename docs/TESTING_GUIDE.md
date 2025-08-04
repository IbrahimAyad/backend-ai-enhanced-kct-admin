# Testing Guide - KCT Menswear

## Overview

This document outlines the comprehensive testing framework implemented for the KCT Menswear project. The testing strategy covers unit tests, integration tests, and Edge Function tests with a focus on security validation.

## Testing Stack

- **Framework**: Vitest (fast, TypeScript-native testing framework)
- **React Testing**: @testing-library/react
- **DOM Environment**: jsdom
- **Mocking**: Vitest built-in mocking
- **Coverage**: Vitest coverage with 80% thresholds
- **UI**: @vitest/ui for interactive test running

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── utils.tsx              # Test utilities and helpers
│   └── integration/           # Integration tests
│       └── checkout.test.ts
├── components/
│   ├── auth/
│   │   └── AuthModal.test.tsx
│   └── cart/
│       └── CartSheet.test.tsx
├── contexts/
│   └── AuthContext.test.tsx
└── lib/
    └── utils.test.ts

supabase/functions/
├── _shared/
│   ├── validation.test.ts
│   └── webhook-security.test.ts
└── create-checkout-secure/
    └── create-checkout-secure.test.ts
```

## Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Test Categories

### 1. Unit Tests

#### Validation Functions (`_shared/validation.test.ts`)
- ✅ Email validation with RFC compliance
- ✅ Amount validation with min/max constraints
- ✅ String sanitization (XSS prevention)
- ✅ Address validation with required/optional fields
- ✅ UUID format validation

#### Security Functions (`_shared/webhook-security.test.ts`)
- ✅ Rate limiting with IP-based tracking
- ✅ Error message sanitization
- ✅ Webhook signature validation (HMAC-SHA256)
- ✅ Replay attack prevention
- ✅ Timestamp validation

#### React Components
- ✅ **AuthModal**: Login/signup flows, validation, error handling
- ✅ **CartSheet**: Cart operations, price calculations, checkout flow
- ✅ **AuthContext**: Authentication state management, session handling

### 2. Integration Tests

#### Checkout Flow (`integration/checkout.test.ts`)
- ✅ Complete checkout process end-to-end
- ✅ Stock validation and out-of-stock handling
- ✅ Price mismatch detection
- ✅ Authentication error handling
- ✅ Network error resilience
- ✅ Order amount validation (min/max)
- ✅ Concurrent checkout handling

### 3. Edge Function Tests

#### Create Checkout Secure
- ✅ Input validation (required fields, formats)
- ✅ Cart item structure validation
- ✅ Rate limiting enforcement
- ✅ Stripe integration testing
- ✅ Database operations
- ✅ Error handling and sanitization
- ✅ Security headers (CORS)
- ✅ Edge cases (empty cart, malformed UUIDs)

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run only Edge Function tests
npm run test:edge-functions
```

### Test Filtering

```bash
# Run specific test file
npx vitest validation.test.ts

# Run tests matching pattern
npx vitest --grep "email validation"

# Run tests in specific directory
npx vitest src/components/auth/
```

## Test Configuration

### Environment Setup (`src/test/setup.ts`)
- Global DOM mocks (IntersectionObserver, ResizeObserver)
- Supabase client mocking
- React Router mocking
- Console logging capture
- Window.matchMedia mocking

### Test Utilities (`src/test/utils.tsx`)
- Custom render function with providers
- Mock data generators (user, product, order, cart items)
- Test helpers (waiting, response creation)
- Mock environment variables

## Mocking Strategy

### Supabase Client
```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { /* auth methods */ },
    from: vi.fn(() => ({ /* query builder */ })),
    functions: { invoke: vi.fn() }
  }))
}))
```

### External APIs
- Stripe API calls
- SendGrid email service
- OpenAI recommendations
- All external HTTP requests

### Environment Variables
```typescript
vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
```

## Security Testing Focus

### Input Validation
- Email format compliance
- SQL injection prevention
- XSS attack prevention
- UUID format validation
- Amount range validation

### Rate Limiting
- IP-based rate limiting
- Different limits per endpoint
- Rate limit reset behavior
- Concurrent request handling

### Authentication
- Token validation
- Session management
- Admin permission checks
- Unauthorized access prevention

### Error Handling
- Sensitive information leakage prevention
- Sanitized error messages
- Proper HTTP status codes
- Graceful degradation

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should validate email format', () => {
     // Arrange
     const email = 'test@example.com'
     
     // Act
     const result = validateEmail(email)
     
     // Assert
     expect(result.isValid).toBe(true)
   })
   ```

2. **Descriptive Test Names**
   - Use "should" statements
   - Describe the expected behavior
   - Include edge cases

3. **Mock External Dependencies**
   - Always mock HTTP requests
   - Mock database calls
   - Mock authentication

4. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Invalid formats
   - Boundary conditions

### Test Organization

1. **Group Related Tests**
   ```typescript
   describe('validateEmail', () => {
     describe('valid emails', () => {
       // Valid email tests
     })
     
     describe('invalid emails', () => {
       // Invalid email tests
     })
   })
   ```

2. **Use Setup/Teardown**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

3. **Isolate Tests**
   - Each test should be independent
   - Clean up after each test
   - Don't rely on test execution order

## CI/CD Integration

### GitHub Actions (example)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run && npm run lint"
    }
  }
}
```

## Coverage Reports

Tests generate comprehensive coverage reports:
- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage.json`
- **Text Summary**: Console output

## Debugging Tests

### VS Code Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--reporter=verbose"],
  "console": "integratedTerminal"
}
```

### Browser Debugging
```bash
# Run tests with UI for debugging
npm run test:ui
```

## Security Test Checklist

- [ ] Input validation for all user inputs
- [ ] SQL injection prevention
- [ ] XSS attack prevention
- [ ] Rate limiting enforcement
- [ ] Authentication bypass prevention
- [ ] Authorization checks
- [ ] Error message sanitization
- [ ] CORS policy validation
- [ ] Environment variable validation
- [ ] Webhook signature verification

## Performance Testing

### Load Testing Edge Functions
```typescript
it('should handle concurrent requests', async () => {
  const promises = Array(10).fill(null).map(() => 
    makeRequest(endpoint, payload)
  )
  
  const results = await Promise.allSettled(promises)
  expect(results.every(r => r.status === 'fulfilled')).toBe(true)
})
```

## Future Enhancements

1. **E2E Testing**: Playwright integration
2. **Visual Regression**: Screenshot testing
3. **Performance**: Lighthouse CI
4. **Accessibility**: axe-core integration
5. **API Testing**: Contract testing with Pact

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mock is defined before import
2. **Async test timeout**: Increase timeout or fix async handling
3. **DOM not available**: Check jsdom setup
4. **Environment variables**: Use vi.stubEnv()

### Debug Commands
```bash
# Verbose output
npx vitest --reporter=verbose

# Debug mode
npx vitest --inspect-brk

# Run single test
npx vitest --run specific.test.ts
```

This comprehensive testing framework ensures code quality, security, and reliability across the entire KCT Menswear application.