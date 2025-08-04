-- FINAL FIX: Based on actual admin_users table structure

-- Step 1: Disable RLS temporarily to fix everything
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what admin users exist
SELECT 'Current admin users:' as info;
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.is_active,
    u.email as user_email
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id;

-- Step 3: Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- Step 5: Create ONE simple SELECT policy that breaks the circular dependency
CREATE POLICY "anyone_can_check_admin_status" ON public.admin_users
    FOR SELECT
    USING (true);

-- Step 6: Create modification policies
CREATE POLICY "service_role_can_manage" ON public.admin_users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Step 7: Test the fix
SELECT 'Test - can we read admin_users?' as test;
SELECT COUNT(*) as visible_admins FROM admin_users;

-- Step 8: Show final policies
SELECT 'Final policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'admin_users';

-- Step 9: If you need to create an admin user, here's the template:
-- First find your user_id from auth.users:
SELECT 'Your auth user:' as info;
SELECT id, email FROM auth.users WHERE email = 'admin@kctmenswear.com';

-- Then use this to create admin (uncomment and replace USER_ID):
/*
INSERT INTO public.admin_users (id, user_id, role, permissions, is_active)
VALUES (
    gen_random_uuid(),
    'REPLACE_WITH_USER_ID_FROM_ABOVE',
    'super_admin',
    ARRAY['all'],
    true
);
*/