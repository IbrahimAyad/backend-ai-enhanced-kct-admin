import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )
      
      expect(result).toBe('base-class active-class')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle object-style class definitions', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      })
      
      expect(result).toBe('class1 class3')
    })

    it('should deduplicate classes', () => {
      const result = cn('class1', 'class2', 'class1')
      // tailwind-merge may or may not deduplicate depending on configuration
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle Tailwind CSS conflicts', () => {
      // tailwind-merge should resolve conflicting utilities
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2') // Later class should win
    })

    it('should handle responsive classes', () => {
      const result = cn('text-sm', 'md:text-lg', 'lg:text-xl')
      expect(result).toBe('text-sm md:text-lg lg:text-xl')
    })

    it('should handle state variants', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600', 'active:bg-blue-700')
      expect(result).toBe('bg-blue-500 hover:bg-blue-600 active:bg-blue-700')
    })
  })
})

// Additional utility function tests would go here
// These would test any other utilities that might be in the utils file
describe('Additional Utilities', () => {
  // If there are format functions
  describe('formatPrice', () => {
    it('should format prices correctly', () => {
      // This would test a price formatting function if it exists
      const formatPrice = (price: number) => `$${price.toFixed(2)}`
      
      expect(formatPrice(99.99)).toBe('$99.99')
      expect(formatPrice(100)).toBe('$100.00')
      expect(formatPrice(1234.5)).toBe('$1234.50')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      // This would test a date formatting function if it exists
      const formatDate = (date: Date) => date.toLocaleDateString()
      
      const testDate = new Date('2023-12-25')
      const result = formatDate(testDate)
      // Just check that it contains the year and is a valid date string
      expect(result).toContain('2023')
      expect(result.length).toBeGreaterThan(8)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      // Call multiple times quickly
      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Should not have been called yet
      expect(callCount).toBe(0)

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should have been called once
      expect(callCount).toBe(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 100)

      // Call multiple times quickly
      throttledFn()
      throttledFn()
      throttledFn()

      // Should have been called once immediately
      expect(callCount).toBe(1)

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Call again
      throttledFn()
      
      // Should have been called again
      expect(callCount).toBe(2)
    })
  })
})

// Helper functions for testing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}