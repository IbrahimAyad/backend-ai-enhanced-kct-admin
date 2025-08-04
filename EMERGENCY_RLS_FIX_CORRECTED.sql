-- EMERGENCY FIX: Break circular dependency in admin authentication
-- This fixes the chicken-and-egg problem preventing admin login

-- Step 1: Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "Admin users can view own record" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update own record" ON public.admin_users;
DROP POLICY IF EXISTS "only_admins_can_view_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "anyone_can_check_admin_status" ON public.admin_users;

-- Step 2: Create a safe SELECT policy that doesn't require being admin to check admin status
CREATE POLICY "safe_admin_status_check" ON public.admin_users
    FOR SELECT
    USING (true);  -- Allow anyone to check if they're an admin

-- Step 3: Create UPDATE/INSERT/DELETE policies that require admin
CREATE POLICY "admins_can_modify_admin_users" ON public.admin_users
    FOR ALL
    USING (
        -- Allow if user is already an admin
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
        OR 
        -- Allow service role (for system operations)
        auth.role() = 'service_role'
    );

-- Step 4: Verify admin user exists
SELECT 
    'Checking admin users:' as status,
    COUNT(*) as admin_count
FROM admin_users
WHERE email = 'admin@kctmenswear.com';

-- Step 5: If no admin exists, you'll need to create one manually
-- Get the user ID for admin@kctmenswear.com from auth.users
SELECT 
    'Auth user info:' as status,
    id as user_id,
    email
FROM auth.users
WHERE email = 'admin@kctmenswear.com';

-- Step 6: If admin user exists in auth but not in admin_users, insert it
-- Replace 'USER_ID_FROM_ABOVE' with the actual ID from step 5
/*
INSERT INTO public.admin_users (user_id, email, role, permissions, is_active)
VALUES (
    'USER_ID_FROM_ABOVE', -- Replace with actual user ID
    'admin@kctmenswear.com',
    'super_admin',
    ARRAY['all'],
    true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    is_active = true,
    role = 'super_admin',
    permissions = ARRAY['all'];
*/

-- Step 7: Test that policies work
SELECT 
    'Policy test:' as test,
    COUNT(*) as visible_admins
FROM admin_users;

-- Step 8: Show final RLS status
SELECT 
    'RLS policies on admin_users:' as status;
    
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'admin_users'
ORDER BY policyname;