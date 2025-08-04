-- Fix RLS policies for admin_users table
-- The current policies are too restrictive for initial login

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can view their own record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Create more permissive SELECT policy
-- Any authenticated user can check if they are an admin
CREATE POLICY "Users can check their own admin status" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- Super admins can view all records
CREATE POLICY "Super admins can view all admin records" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- Only super admins can insert/update/delete
CREATE POLICY "Super admins can manage admin users" ON public.admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
    -- Allow first super admin to be created
    OR NOT EXISTS (SELECT 1 FROM public.admin_users WHERE role = 'super_admin')
  );

CREATE POLICY "Super admins can update admin users" ON public.admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete admin users" ON public.admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- Test the policies
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id;