-- URGENT: Fix Admin Authentication RLS Circular Dependency
-- This SQL fixes the chicken-and-egg problem preventing admin login

-- STEP 1: Drop ALL existing policies on admin_users table to break circular dependency
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- STEP 2: Create non-circular SELECT policy
-- This allows ANY authenticated user to check admin status (essential for auth flow)
CREATE POLICY "authenticated_users_can_check_admin_status" ON public.admin_users
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);  -- Allow all authenticated users to read admin table

-- STEP 3: Restrict write operations to service role only (for safety)
CREATE POLICY "service_role_manages_admins" ON public.admin_users
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- STEP 4: Create/Update the main admin user
-- First, ensure the auth user exists and get their ID
WITH user_info AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'support@kctmenswear.com'
  LIMIT 1
)
-- Insert into admin_users table (will skip if already exists)
INSERT INTO public.admin_users (user_id, role, permissions, is_active)
SELECT 
  id as user_id,
  'super_admin' as role,
  ARRAY['all'] as permissions,
  true as is_active
FROM user_info
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE user_id = (SELECT id FROM user_info)
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  permissions = ARRAY['all'],
  is_active = true,
  updated_at = NOW();

-- STEP 5: Verify the fix worked
SELECT 
  'ADMIN AUTH FIX: SUCCESS' as status,
  au.role,
  au.permissions,
  au.is_active,
  u.email
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'support@kctmenswear.com';

-- STEP 6: Show all current policies for verification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'admin_users' AND schemaname = 'public';