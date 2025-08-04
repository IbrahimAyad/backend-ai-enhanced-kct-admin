import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { AuthModal } from './AuthModal'

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn()
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form by default', () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should switch to signup form when requested', async () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(signUpButton)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    // Switch to signup
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/password must be/i)).toBeInTheDocument()
    })
  })

  it('should handle successful login', async () => {
    const mockOnClose = vi.fn()
    
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null
    })
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should handle login errors', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' }
    })
    
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  it('should handle successful signup', async () => {
    const mockOnClose = vi.fn()
    
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null
    })
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to signup
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(async () => {
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
    })
    
    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123'
      })
    })
  })

  it('should validate password confirmation', async () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    // Switch to signup
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(async () => {
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
      fireEvent.click(submitButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('should handle forgot password flow', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null
    })
    
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    const forgotButton = screen.getByRole('button', { name: /forgot password/i })
    fireEvent.click(forgotButton)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    const resetButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(resetButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByText(/reset link sent/i)).toBeInTheDocument()
    })
  })

  it('should close modal when clicking outside', () => {
    const mockOnClose = vi.fn()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    const overlay = screen.getByTestId('modal-overlay')
    fireEvent.click(overlay)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal with escape key', () => {
    const mockOnClose = vi.fn()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    render(<AuthModal isOpen={false} onClose={() => {}} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should disable submit button while loading', async () => {
    // Mock a slow auth response
    mockSupabase.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<AuthModal isOpen={true} onClose={() => {}} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })
})