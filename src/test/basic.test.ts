import { describe, it, expect } from 'vitest'

describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async tests', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })

  it('should handle environment variables', () => {
    // Environment variables should exist (values may vary)
    expect(process.env.VITE_SUPABASE_URL).toBeDefined()
    expect(process.env.VITE_SUPABASE_ANON_KEY).toBeDefined()
  })
})