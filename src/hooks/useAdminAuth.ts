import { useEffect, useState } from 'react';
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

export function useAdminAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminUser(null);
      setLoading(false);
      return;
    }

    try {
      // Check if user is in admin_users table
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !adminData) {
        console.log('User is not an admin');
        setIsAdmin(false);
        setAdminUser(null);
        
        // Redirect non-admin users
        toast.error('Unauthorized: Admin access required');
        navigate('/');
      } else {
        console.log('Admin user verified:', adminData);
        setIsAdmin(true);
        setAdminUser(adminData);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true; // Super admins have all permissions
    return adminUser.permissions.includes(permission);
  };

  const requirePermission = (permission: string): void => {
    if (!hasPermission(permission)) {
      toast.error(`Insufficient permissions: ${permission} required`);
      navigate('/admin');
    }
  };

  return {
    isAdmin,
    adminUser,
    loading,
    hasPermission,
    requirePermission,
    checkAdminStatus
  };
}