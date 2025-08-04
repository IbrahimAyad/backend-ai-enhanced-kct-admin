import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'manager';
  permissions: string[];
  created_at: string;
  is_active: boolean;
}

interface AdminAuthState {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export function useAdminAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    adminUser: null,
    loading: true,
    error: null,
    retryCount: 0,
  });

  const checkAdminStatus = useCallback(async (isRetry = false) => {
    if (!user) {
      setState({
        isAdmin: false,
        adminUser: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        retryCount: isRetry ? prev.retryCount + 1 : 0,
      }));

      console.log('🔍 Checking admin status for user:', user.email);

      // Use maybeSingle to avoid errors when no record exists
      // This is safe because we fixed the RLS circular dependency
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Admin status check failed:', error);
        
        // Handle specific RLS errors
        if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Database access denied. Please check RLS policies.',
          }));
          
          // Don't redirect on RLS errors - this indicates a configuration issue
          toast.error('Database configuration error. Please contact support.');
          return;
        }

        // Handle network/connection errors
        if (error.message.includes('network') || error.message.includes('connection')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Network connection error. Please check your internet connection.',
          }));
          return;
        }

        // Generic error handling
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message,
        }));
        return;
      }

      if (adminData) {
        console.log('✅ Admin user verified:', adminData);
        setState({
          isAdmin: true,
          adminUser: adminData,
          loading: false,
          error: null,
          retryCount: 0,
        });
      } else {
        console.log('ℹ️ User is not an admin:', user.email);
        setState({
          isAdmin: false,
          adminUser: null,
          loading: false,
          error: null,
          retryCount: 0,
        });
        
        // Only redirect non-admin users if they're trying to access admin routes
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') && currentPath !== '/admin/test-auth') {
          toast.error('Unauthorized: Admin access required');
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('❌ Admin auth error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
      }));

      // Don't redirect on unexpected errors - might be temporary
      toast.error(`Authentication error: ${errorMessage}`);
    }
  }, [user, navigate]);

  // Retry mechanism for failed checks
  const retryAdminCheck = useCallback(() => {
    if (state.retryCount < 3) {
      console.log(`🔄 Retrying admin check (attempt ${state.retryCount + 1}/3)`);
      checkAdminStatus(true);
    } else {
      console.log('❌ Max retry attempts reached');
      toast.error('Unable to verify admin status. Please refresh the page.');
    }
  }, [checkAdminStatus, state.retryCount]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.adminUser) return false;
    if (state.adminUser.role === 'super_admin') return true;
    return state.adminUser.permissions.includes(permission);
  }, [state.adminUser]);

  const requirePermission = useCallback((permission: string): void => {
    if (!hasPermission(permission)) {
      toast.error(`Insufficient permissions: ${permission} required`);
      navigate('/admin');
    }
  }, [hasPermission, navigate]);

  // Enhanced permission checking with detailed feedback
  const checkPermissionWithFeedback = useCallback((permission: string): {
    allowed: boolean;
    reason?: string;
  } => {
    if (!state.adminUser) {
      return { allowed: false, reason: 'Not logged in as admin' };
    }
    
    if (state.adminUser.role === 'super_admin') {
      return { allowed: true };
    }
    
    if (state.adminUser.permissions.includes(permission)) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: `Missing permission: ${permission}. Current permissions: ${state.adminUser.permissions.join(', ')}` 
    };
  }, [state.adminUser]);

  // Role hierarchy checking
  const hasRoleOrHigher = useCallback((minRole: AdminUser['role']): boolean => {
    if (!state.adminUser) return false;
    
    const roleHierarchy: Record<AdminUser['role'], number> = {
      'super_admin': 3,
      'admin': 2,
      'manager': 1,
    };
    
    return roleHierarchy[state.adminUser.role] >= roleHierarchy[minRole];
  }, [state.adminUser]);

  return {
    // Core state
    isAdmin: state.isAdmin,
    adminUser: state.adminUser,
    loading: state.loading,
    error: state.error,
    
    // Permission methods
    hasPermission,
    requirePermission,
    checkPermissionWithFeedback,
    hasRoleOrHigher,
    
    // Control methods
    checkAdminStatus: () => checkAdminStatus(false),
    retryAdminCheck,
    
    // Debug info
    retryCount: state.retryCount,
    canRetry: state.retryCount < 3,
  };
}