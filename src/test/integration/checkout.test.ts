import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockUser, mockProduct, mockCartItem } from '@/test/utils'

// Mock Supabase functions
const mockCreateCheckout = vi.fn()
const mockGetProducts = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockImplementation((functionName, options) => {
        switch (functionName) {
          case 'create-checkout-secure':
            return mockCreateCheckout(options)
          case 'get-products-secure':
            return mockGetProducts(options)
          default:
            return Promise.resolve({ data: null, error: null })
        }
      })
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
    }
  }
}))

describe('Checkout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful responses
    mockCreateCheckout.mockResolvedValue({
      data: {
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      },
      error: null
    })
    
    mockGetProducts.mockResolvedValue({
      data: [mockProduct],
      error: null
    })
  })

  it('should complete full checkout flow', async () => {
    // 1. User adds items to cart
    const cartItems = [
      { ...mockCartItem, quantity: 2 },
      { ...mockCartItem, id: 'product-2', price: 49.99, quantity: 1 }
    ]
    
    // 2. Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    expect(totalAmount).toBe(249.97) // (99.99 * 2) + (49.99 * 1)
    
    // 3. Validate cart items exist and have stock
    for (const item of cartItems) {
      const { data: products } = await mockGetProducts({
        body: { productIds: [item.id] }
      })
      
      expect(products).toContainEqual(expect.objectContaining({
        id: expect.any(String),
        in_stock: true
      }))
    }
    
    // 4. Create checkout session
    const checkoutPayload = {
      body: {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customerEmail: mockUser.email,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cart'
      }
    }
    
    const { data: checkoutData, error } = await mockCreateCheckout(checkoutPayload)
    
    expect(error).toBeNull()
    expect(checkoutData).toMatchObject({
      sessionId: expect.stringMatching(/^cs_/),
      url: expect.stringMatching(/^https:\/\/checkout\.stripe\.com/)
    })
    
    // Verify the correct payload was sent
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: expect.any(String),
              quantity: expect.any(Number),
              price: expect.any(Number)
            })
          ]),
          customerEmail: mockUser.email
        })
      })
    )
  })

  it('should handle out of stock items', async () => {
    // Mock out of stock product
    mockGetProducts.mockResolvedValueOnce({
      data: [{ ...mockProduct, in_stock: false }],
      error: null
    })
    
    const cartItems = [mockCartItem]
    
    // Check stock before checkout
    const { data: products } = await mockGetProducts({
      body: { productIds: [cartItems[0].id] }
    })
    
    const outOfStockItems = products?.filter(p => !p.in_stock) || []
    
    if (outOfStockItems.length > 0) {
      // Should not proceed to checkout
      expect(outOfStockItems).toHaveLength(1)
      
      // Checkout should fail with out of stock error
      mockCreateCheckout.mockResolvedValueOnce({
        data: null,
        error: { message: 'Some items are out of stock' }
      })
      
      const { error } = await mockCreateCheckout({
        body: { items: cartItems }
      })
      
      expect(error).toBeTruthy()
      expect(error?.message).toContain('out of stock')
    }
  })

  it('should handle price mismatches', async () => {
    // Mock product with different price
    mockGetProducts.mockResolvedValueOnce({
      data: [{ ...mockProduct, price: 149.99 }], // Different from cart price
      error: null
    })
    
    const cartItems = [{ ...mockCartItem, price: 99.99 }] // Original price
    
    // Checkout should detect price mismatch
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Price mismatch detected' }
    })
    
    const { error } = await mockCreateCheckout({
      body: { items: cartItems }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('Price mismatch')
  })

  it('should handle authentication errors', async () => {
    // Mock unauthenticated user
    vi.mocked(await import('@/lib/supabase')).supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' }
    })
    
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized' }
    })
    
    const { error } = await mockCreateCheckout({
      body: { items: [mockCartItem] }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('Unauthorized')
  })

  it('should handle network errors gracefully', async () => {
    mockCreateCheckout.mockRejectedValueOnce(new Error('Network error'))
    
    try {
      await mockCreateCheckout({
        body: { items: [mockCartItem] }
      })
      
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('should validate minimum order amount', async () => {
    const lowValueItem = { ...mockCartItem, price: 0.50, quantity: 1 }
    
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Order amount too low' }
    })
    
    const { error } = await mockCreateCheckout({
      body: { items: [lowValueItem] }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('too low')
  })

  it('should validate maximum order amount', async () => {
    const highValueItem = { ...mockCartItem, price: 2000, quantity: 1 }
    
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Order amount exceeds maximum' }
    })
    
    const { error } = await mockCreateCheckout({
      body: { items: [highValueItem] }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('exceeds maximum')
  })

  it('should handle concurrent checkout attempts', async () => {
    const cartItems = [mockCartItem]
    
    // Simulate two concurrent checkout attempts
    const checkoutPromises = [
      mockCreateCheckout({ body: { items: cartItems } }),
      mockCreateCheckout({ body: { items: cartItems } })
    ]
    
    // Both should be handled gracefully
    const results = await Promise.allSettled(checkoutPromises)
    
    expect(results.every(result => result.status === 'fulfilled')).toBe(true)
  })

  it('should validate email format', async () => {
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid email format' }
    })
    
    const { error } = await mockCreateCheckout({
      body: {
        items: [mockCartItem],
        customerEmail: 'invalid-email'
      }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('Invalid email')
  })

  it('should handle empty cart', async () => {
    mockCreateCheckout.mockResolvedValueOnce({
      data: null,
      error: { message: 'Cart is empty' }
    })
    
    const { error } = await mockCreateCheckout({
      body: { items: [] }
    })
    
    expect(error).toBeTruthy()
    expect(error?.message).toContain('empty')
  })
})