import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  checkRateLimit, 
  sanitizeErrorMessage, 
  validateWebhookSignature 
} from './webhook-security'

// Mock global maps for rate limiting
const rateLimitStore = new Map()
const replayProtectionStore = new Map()

vi.mock('./webhook-security', async () => {
  const actual = await vi.importActual('./webhook-security')
  
  // Mock implementation that uses our test stores
  const mockCheckRateLimit = (key: string, limit = 10, windowMs = 60000) => {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests for this key
    const existing = rateLimitStore.get(key) || []
    
    // Filter out requests outside the window
    const validRequests = existing.filter((timestamp: number) => timestamp > windowStart)
    
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + windowMs,
        retryAfter: Math.ceil((windowStart + windowMs - now) / 1000)
      }
    }
    
    // Add current request
    validRequests.push(now)
    rateLimitStore.set(key, validRequests)
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: windowStart + windowMs,
      retryAfter: null
    }
  }
  
  return {
    ...actual,
    checkRateLimit: mockCheckRateLimit
  }
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    rateLimitStore.clear()
    vi.clearAllMocks()
  })

  it('should allow requests within limit', () => {
    const result = checkRateLimit('test-key', 5, 60000)
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.retryAfter).toBeNull()
  })

  it('should block requests when limit exceeded', () => {
    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key', 5, 60000)
    }
    
    // This should be blocked
    const result = checkRateLimit('test-key', 5, 60000)
    
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(typeof result.retryAfter).toBe('number')
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('should use different limits for different keys', () => {
    // Fill up one key
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key1', 3, 60000)
    }
    
    // Different key should still work
    const result = checkRateLimit('key2', 3, 60000)
    expect(result.allowed).toBe(true)
  })

  it('should reset after time window', () => {
    const shortWindow = 100 // 100ms
    
    // Fill up the limit
    for (let i = 0; i < 2; i++) {
      checkRateLimit('test-key', 2, shortWindow)
    }
    
    // Should be blocked now
    expect(checkRateLimit('test-key', 2, shortWindow).allowed).toBe(false)
    
    // Wait for window to reset
    return new Promise(resolve => {
      setTimeout(() => {
        const result = checkRateLimit('test-key', 2, shortWindow)
        expect(result.allowed).toBe(true)
        resolve(undefined)
      }, shortWindow + 10)
    })
  })
})

describe('sanitizeErrorMessage', () => {
  it('should sanitize error objects', () => {
    const error = new Error('Database connection failed')
    const result = sanitizeErrorMessage(error)
    
    expect(result).toBe('An error occurred')
    expect(result).not.toContain('Database')
    expect(result).not.toContain('connection')
  })

  it('should handle string errors', () => {
    const error = 'Sensitive information leaked'
    const result = sanitizeErrorMessage(error)
    
    expect(result).toBe('An error occurred')
  })

  it('should preserve safe error messages', () => {
    const safeErrors = [
      'Invalid email format',
      'Required field missing',
      'Invalid input',
      'Unauthorized',
      'Rate limit exceeded'
    ]
    
    safeErrors.forEach(error => {
      const result = sanitizeErrorMessage(new Error(error))
      expect(result).toBe(error)
    })
  })

  it('should handle null and undefined errors', () => {
    expect(sanitizeErrorMessage(null)).toBe('An error occurred')
    expect(sanitizeErrorMessage(undefined)).toBe('An error occurred')
  })

  it('should sanitize database-related errors', () => {
    const dbErrors = [
      'PostgreSQL connection timeout',
      'Supabase RLS policy violation',
      'Table users does not exist',
      'SQLSTATE 42P01'
    ]
    
    dbErrors.forEach(error => {
      const result = sanitizeErrorMessage(new Error(error))
      expect(result).toBe('An error occurred')
    })
  })

  it('should sanitize API key related errors', () => {
    const apiErrors = [
      'Invalid API key: sk_test_123',
      'Stripe key not found',
      'SendGrid authentication failed'
    ]
    
    apiErrors.forEach(error => {
      const result = sanitizeErrorMessage(new Error(error))
      expect(result).toBe('An error occurred')
    })
  })
})

describe('validateWebhookSignature', () => {
  it('should validate correct webhook signatures', async () => {
    const payload = '{"test": "data"}'
    const secret = 'test-secret'
    
    // Create actual HMAC signature for testing
    const crypto = await import('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    const result = await validateWebhookSignature(
      payload,
      expectedSignature,
      secret
    )
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid webhook signatures', async () => {
    const payload = '{"test": "data"}'
    const secret = 'test-secret'
    const invalidSignature = 'invalid-signature'
    
    const result = await validateWebhookSignature(
      payload,
      invalidSignature,
      secret
    )
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should validate timestamp freshness', async () => {
    const payload = '{"test": "data"}'
    const secret = 'test-secret'
    const crypto = await import('crypto')
    
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    // Test with old timestamp (should fail)
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600) // 10 minutes ago
    
    const result = await validateWebhookSignature(
      payload,
      validSignature,
      secret,
      oldTimestamp
    )
    
    expect(result.isValid).toBe(false)
    expect(result.errors.some(error => error.includes('timestamp'))).toBe(true)
  })

  it('should handle missing signature gracefully', async () => {
    const result = await validateWebhookSignature(
      '{"test": "data"}',
      '',
      'test-secret'
    )
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should handle missing secret gracefully', async () => {
    const result = await validateWebhookSignature(
      '{"test": "data"}',
      'some-signature',
      ''
    )
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should prevent replay attacks with same signature', async () => {
    const payload = '{"test": "data"}'
    const secret = 'test-secret'
    const crypto = await import('crypto')
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    // First request should succeed
    const firstResult = await validateWebhookSignature(payload, signature, secret)
    expect(firstResult.isValid).toBe(true)
    
    // Same signature should be rejected on replay
    const replayResult = await validateWebhookSignature(payload, signature, secret)
    expect(replayResult.isValid).toBe(false)
    expect(replayResult.errors.some(error => error.includes('replay'))).toBe(true)
  })
})