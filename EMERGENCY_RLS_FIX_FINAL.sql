-- EMERGENCY FIX: Break circular dependency in admin authentication

-- Step 1: Drop all existing policies on admin_users
DROP POLICY IF EXISTS "Admin users can view own record" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update own record" ON public.admin_users;
DROP POLICY IF EXISTS "only_admins_can_view_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "anyone_can_check_admin_status" ON public.admin_users;
DROP POLICY IF EXISTS "safe_admin_status_check" ON public.admin_users;
DROP POLICY IF EXISTS "admins_can_modify_admin_users" ON public.admin_users;

-- Step 2: Create simple SELECT policy
CREATE POLICY "safe_admin_status_check" ON public.admin_users
    FOR SELECT
    USING (true);

-- Step 3: Create modification policy for admins
CREATE POLICY "admins_can_modify_admin_users" ON public.admin_users
    FOR INSERT
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.user_id = auth.uid()
        AND au.is_active = true
    ));

CREATE POLICY "admins_can_update_admin_users" ON public.admin_users
    FOR UPDATE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.user_id = auth.uid()
        AND au.is_active = true
    ));

CREATE POLICY "admins_can_delete_admin_users" ON public.admin_users
    FOR DELETE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.user_id = auth.uid()
        AND au.is_active = true
    ));

-- Step 4: Check results
SELECT 'Admin users table:' as info, COUNT(*) as count FROM admin_users;
SELECT 'Policies created:' as info, COUNT(*) as count FROM pg_policies WHERE tablename = 'admin_users';