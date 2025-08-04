import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validateAmount, 
  sanitizeString, 
  validateAddress,
  isValidUUID 
} from './validation'

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@gmail.com',
      'user123@test-domain.com'
    ]

    validEmails.forEach(email => {
      const result = validateEmail(email)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(email.toLowerCase().trim())
      expect(result.errors).toHaveLength(0)
    })
  })

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
      '',
      ' ',
      'user space@domain.com',
      'user..double@domain.com'
    ]

    invalidEmails.forEach(email => {
      const result = validateEmail(email)
      expect(result.isValid).toBe(false)
      expect(result.sanitized).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  it('should trim and lowercase valid emails', () => {
    const result = validateEmail('  TEST@EXAMPLE.COM  ')
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe('test@example.com')
  })

  it('should handle null and undefined inputs', () => {
    expect(validateEmail(null as any).isValid).toBe(false)
    expect(validateEmail(undefined as any).isValid).toBe(false)
  })
})

describe('validateAmount', () => {
  it('should validate correct amounts', () => {
    const validAmounts = [
      { input: 10.50, options: { min: 0, max: 100 } },
      { input: '25.99', options: { min: 0, max: 100 } },
      { input: 0, options: { min: 0, max: 100 } },
      { input: 100, options: { min: 0, max: 100 } }
    ]

    validAmounts.forEach(({ input, options }) => {
      const result = validateAmount(input, options)
      expect(result.isValid).toBe(true)
      expect(typeof result.sanitized).toBe('number')
      expect(result.errors).toHaveLength(0)
    })
  })

  it('should reject invalid amounts', () => {
    const invalidAmounts = [
      { input: -1, options: { min: 0, max: 100 } }, // below min
      { input: 101, options: { min: 0, max: 100 } }, // above max
      { input: 'not-a-number', options: { min: 0, max: 100 } },
      { input: NaN, options: { min: 0, max: 100 } },
      { input: Infinity, options: { min: 0, max: 100 } }
    ]

    invalidAmounts.forEach(({ input, options }) => {
      const result = validateAmount(input, options)
      expect(result.isValid).toBe(false)
      expect(result.sanitized).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  it('should handle decimal precision', () => {
    const result = validateAmount(19.999, { min: 0, max: 100 })
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe(20.00) // Should round to 2 decimal places
  })

  it('should validate with default options when none provided', () => {
    const result = validateAmount(50)
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe(50)
  })
})

describe('sanitizeString', () => {
  it('should sanitize basic strings', () => {
    const testCases = [
      { input: 'Hello World', expected: 'Hello World' },
      { input: '  trimmed  ', expected: 'trimmed' },
      { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert("xss")&lt;/script&gt;' },
      { input: 'Line1\nLine2', expected: 'Line1 Line2' },
      { input: 'Tab\tSeparated', expected: 'Tab Separated' }
    ]

    testCases.forEach(({ input, expected }) => {
      const result = sanitizeString(input)
      expect(result).toBe(expected)
    })
  })

  it('should enforce maximum length', () => {
    const longString = 'a'.repeat(200)
    const result = sanitizeString(longString, 50)
    expect(result.length).toBe(50)
  })

  it('should handle empty and null inputs', () => {
    expect(sanitizeString('')).toBe('')
    expect(sanitizeString(null as any)).toBe('')
    expect(sanitizeString(undefined as any)).toBe('')
  })

  it('should remove dangerous characters', () => {
    const dangerousInput = '<img src="x" onerror="alert(1)">'
    const result = sanitizeString(dangerousInput)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('onerror')
  })
})

describe('validateAddress', () => {
  it('should validate complete addresses', () => {
    const validAddress = {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    }

    const result = validateAddress(validAddress, true)
    expect(result.isValid).toBe(true)
    expect(result.sanitized).toEqual(validAddress)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject incomplete addresses when required', () => {
    const incompleteAddress = {
      street: '123 Main St',
      city: '',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    }

    const result = validateAddress(incompleteAddress, true)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should allow optional fields when not required', () => {
    const minimalAddress = {
      street: '123 Main St',
      city: 'Anytown',
      state: '',
      zipCode: '',
      country: 'USA'
    }

    const result = validateAddress(minimalAddress, false)
    expect(result.isValid).toBe(true)
  })

  it('should sanitize address fields', () => {
    const addressWithHTML = {
      street: '<script>123 Main St</script>',
      city: 'Any<town>',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    }

    const result = validateAddress(addressWithHTML, true)
    expect(result.isValid).toBe(true)
    expect(result.sanitized?.street).not.toContain('<script>')
    expect(result.sanitized?.city).not.toContain('<')
  })
})

describe('isValidUUID', () => {
  it('should validate correct UUIDs', () => {
    const validUUIDs = [
      '123e4567-e89b-12d3-a456-426614174000',
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff'
    ]

    validUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(true)
    })
  })

  it('should reject invalid UUIDs', () => {
    const invalidUUIDs = [
      '123e4567-e89b-12d3-a456-42661417400', // too short
      '123e4567-e89b-12d3-a456-4266141740000', // too long
      '123e4567-e89b-12d3-a456-42661417400g', // invalid character
      'not-a-uuid',
      '',
      '123e4567e89b12d3a456426614174000' // missing dashes
    ]

    invalidUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(false)
    })
  })

  it('should handle null and undefined inputs', () => {
    expect(isValidUUID(null as any)).toBe(false)
    expect(isValidUUID(undefined as any)).toBe(false)
  })
})