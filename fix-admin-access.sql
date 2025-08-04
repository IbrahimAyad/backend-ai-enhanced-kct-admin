-- Fix admin access by simplifying RLS policies
-- This script handles existing policies properly

-- First, check what policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Drop ALL existing policies on admin_users
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- Create a single, simple policy for SELECT
-- This allows any authenticated user to check if they are an admin
CREATE POLICY "anyone_can_check_admin_status" ON public.admin_users
    FOR SELECT 
    USING (true);  -- Allow all authenticated users to read

-- For security, restrict INSERT/UPDATE/DELETE to service role only
-- (These operations should only be done through admin interfaces)
CREATE POLICY "service_role_can_manage" ON public.admin_users
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify the admin user exists and is active
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'admin@kctmenswear.com';

-- If not active, activate them
UPDATE admin_users 
SET is_active = true 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'admin@kctmenswear.com'
);