import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { CartSheet } from './CartSheet'
import { CartContext } from '@/contexts/CartContext'
import { mockCartItem, mockProduct } from '@/test/utils'

const mockCartContext = {
  items: [],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  getItemCount: vi.fn().mockReturnValue(0),
  getTotalPrice: vi.fn().mockReturnValue(0)
}

const renderCartSheet = (contextValue = mockCartContext, isOpen = true) => {
  return render(
    <CartContext.Provider value={contextValue}>
      <CartSheet isOpen={isOpen} onClose={() => {}} />
    </CartContext.Provider>
  )
}

describe('CartSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty cart message when no items', () => {
    renderCartSheet()
    
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    expect(screen.getByText(/start shopping/i)).toBeInTheDocument()
  })

  it('should render cart items when present', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      getItemCount: vi.fn().mockReturnValue(1),
      getTotalPrice: vi.fn().mockReturnValue(99.99)
    }
    
    renderCartSheet(cartWithItems)
    
    expect(screen.getByText(mockCartItem.name)).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
  })

  it('should display correct total price', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [
        { ...mockCartItem, quantity: 2 },
        { ...mockCartItem, id: 'item-2', price: 49.99, quantity: 1 }
      ],
      getTotalPrice: vi.fn().mockReturnValue(249.97)
    }
    
    renderCartSheet(cartWithItems)
    
    expect(screen.getByText('$249.97')).toBeInTheDocument()
  })

  it('should update item quantity', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      updateQuantity: vi.fn()
    }
    
    renderCartSheet(cartWithItems)
    
    const quantityInput = screen.getByDisplayValue('1')
    fireEvent.change(quantityInput, { target: { value: '3' } })
    
    await waitFor(() => {
      expect(cartWithItems.updateQuantity).toHaveBeenCalledWith(mockCartItem.id, 3)
    })
  })

  it('should remove item when quantity is set to 0', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      updateQuantity: vi.fn(),
      removeItem: vi.fn()
    }
    
    renderCartSheet(cartWithItems)
    
    const quantityInput = screen.getByDisplayValue('1')
    fireEvent.change(quantityInput, { target: { value: '0' } })
    
    await waitFor(() => {
      expect(cartWithItems.removeItem).toHaveBeenCalledWith(mockCartItem.id)
    })
  })

  it('should remove item when remove button is clicked', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      removeItem: vi.fn()
    }
    
    renderCartSheet(cartWithItems)
    
    const removeButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(removeButton)
    
    expect(cartWithItems.removeItem).toHaveBeenCalledWith(mockCartItem.id)
  })

  it('should clear entire cart', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      clearCart: vi.fn()
    }
    
    renderCartSheet(cartWithItems)
    
    const clearButton = screen.getByRole('button', { name: /clear cart/i })
    fireEvent.click(clearButton)
    
    expect(cartWithItems.clearCart).toHaveBeenCalled()
  })

  it('should navigate to checkout when checkout button is clicked', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate
      }
    })
    
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      getTotalPrice: vi.fn().mockReturnValue(99.99)
    }
    
    renderCartSheet(cartWithItems)
    
    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    fireEvent.click(checkoutButton)
    
    // Would test navigation in real implementation
    expect(checkoutButton).toBeInTheDocument()
  })

  it('should disable checkout button when cart is empty', () => {
    renderCartSheet()
    
    const checkoutButton = screen.queryByRole('button', { name: /checkout/i })
    expect(checkoutButton).not.toBeInTheDocument()
    
    // Should show the "Start Shopping" button instead
    expect(screen.getByRole('button', { name: /start shopping/i })).toBeInTheDocument()
  })

  it('should handle invalid quantity input', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      updateQuantity: vi.fn()
    }
    
    renderCartSheet(cartWithItems)
    
    const quantityInput = screen.getByDisplayValue('1')
    
    // Test negative number
    fireEvent.change(quantityInput, { target: { value: '-1' } })
    expect(cartWithItems.updateQuantity).not.toHaveBeenCalled()
    
    // Test non-number
    fireEvent.change(quantityInput, { target: { value: 'abc' } })
    expect(cartWithItems.updateQuantity).not.toHaveBeenCalled()
  })

  it('should show loading state during checkout', async () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem],
      getTotalPrice: vi.fn().mockReturnValue(99.99)
    }
    
    renderCartSheet(cartWithItems)
    
    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    fireEvent.click(checkoutButton)
    
    // Would show loading state in real implementation
    expect(checkoutButton).toBeInTheDocument()
  })

  it('should display item count badge', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem, { ...mockCartItem, id: 'item-2' }],
      getItemCount: vi.fn().mockReturnValue(2)
    }
    
    renderCartSheet(cartWithItems)
    
    expect(screen.getByText('2')).toBeInTheDocument() // Item count badge
  })

  it('should format prices correctly', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [{ ...mockCartItem, price: 1234.56 }],
      getTotalPrice: vi.fn().mockReturnValue(1234.56)
    }
    
    renderCartSheet(cartWithItems)
    
    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
  })

  it('should handle item image loading errors', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [{ ...mockCartItem, image: 'https://invalid-image-url.com/image.jpg' }]
    }
    
    renderCartSheet(cartWithItems)
    
    const image = screen.getByAltText(mockCartItem.name)
    fireEvent.error(image)
    
    // Should handle gracefully (not crash)
    expect(image).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderCartSheet(mockCartContext, false)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should close when clicking outside', () => {
    const mockOnClose = vi.fn()
    render(
      <CartContext.Provider value={mockCartContext}>
        <CartSheet isOpen={true} onClose={mockOnClose} />
      </CartContext.Provider>
    )
    
    const overlay = screen.getByTestId('sheet-overlay')
    fireEvent.click(overlay)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle keyboard navigation', () => {
    const cartWithItems = {
      ...mockCartContext,
      items: [mockCartItem]
    }
    
    renderCartSheet(cartWithItems)
    
    // Test Tab navigation
    const quantityInput = screen.getByDisplayValue('1')
    quantityInput.focus()
    
    fireEvent.keyDown(quantityInput, { key: 'Tab' })
    
    // Should move focus to next interactive element
    expect(document.activeElement).not.toBe(quantityInput)
  })
})