import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { mockUser } from '@/test/utils'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn()
  }
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      {user ? (
        <div>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div data-testid="no-user">No user</div>
      )}
    </div>
  )
}

const renderAuthProvider = (children = <TestComponent />) => {
  return render(
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  it('should provide initial loading state', () => {
    renderAuthProvider()
    
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  it('should handle authenticated user session', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'mock-token'
        } 
      },
      error: null
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })

  it('should handle no authenticated user', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })

  it('should handle session errors', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Session error' }
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })

  it('should handle auth state changes', async () => {
    let authStateCallback: (event: string, session: any) => void
    
    mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
    
    // Simulate sign in
    authStateCallback!('SIGNED_IN', { 
      user: mockUser,
      access_token: 'mock-token'
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
    })
    
    // Simulate sign out
    authStateCallback!('SIGNED_OUT', null)
    
    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
  })

  it('should handle sign out', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'mock-token'
        } 
      },
      error: null
    })
    
    mockSupabase.auth.signOut.mockResolvedValueOnce({
      error: null
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
    })
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    signOutButton.click()
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should unsubscribe from auth changes on unmount', () => {
    const mockUnsubscribe = vi.fn()
    
    mockSupabase.auth.onAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
    
    const { unmount } = renderAuthProvider()
    
    unmount()
    
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('should handle token refresh', async () => {
    let authStateCallback: (event: string, session: any) => void
    
    mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'old-token'
        } 
      },
      error: null
    })
    
    renderAuthProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
    })
    
    // Simulate token refresh
    authStateCallback!('TOKEN_REFRESHED', { 
      user: mockUser,
      access_token: 'new-token'
    })
    
    // User should still be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
    })
  })

  it('should handle password recovery', async () => {
    let authStateCallback: (event: string, session: any) => void
    
    mockSupabase.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    
    renderAuthProvider()
    
    // Simulate password recovery
    authStateCallback!('PASSWORD_RECOVERY', { 
      user: mockUser,
      access_token: 'recovery-token'
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
    })
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('should handle concurrent session requests', async () => {
    // Mock multiple rapid calls to getSession
    mockSupabase.auth.getSession
      .mockResolvedValueOnce({
        data: { session: null },
        error: null
      })
      .mockResolvedValueOnce({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token'
          } 
        },
        error: null
      })
    
    renderAuthProvider()
    
    // Should handle the race condition gracefully
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })
})