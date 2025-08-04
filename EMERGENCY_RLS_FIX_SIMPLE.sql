-- EMERGENCY FIX: Simple approach to fix admin authentication

-- Step 1: Disable RLS temporarily on admin_users to fix everything
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify admin user exists
SELECT 'Admin users:' as info;
SELECT user_id, email, role, is_active FROM admin_users;

-- Step 3: Now re-enable RLS with proper policies
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

-- Step 5: Create simple working policies
-- Allow everyone to read (to check if they're admin)
CREATE POLICY "anyone_can_read_admin_status" ON public.admin_users
    FOR SELECT
    USING (true);

-- Only admins can insert
CREATE POLICY "admins_can_insert" ON public.admin_users
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Only admins can update
CREATE POLICY "admins_can_update" ON public.admin_users
    FOR UPDATE
    USING (
        auth.role() = 'service_role' 
        OR user_id = auth.uid()
    );

-- Only admins can delete
CREATE POLICY "admins_can_delete" ON public.admin_users
    FOR DELETE
    USING (auth.role() = 'service_role');

-- Step 6: Test
SELECT 'Final check - policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'admin_users';

SELECT 'Can we read admin_users?' as test;
SELECT COUNT(*) as admin_count FROM admin_users;