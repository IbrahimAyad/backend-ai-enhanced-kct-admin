-- ============================================
-- RLS POLICY FIX - FINAL VERSION
-- ============================================
-- This fixes the INSERT policy syntax error
-- Only runs what's necessary based on previous attempts

-- ============================================
-- FIX USER_PROFILES POLICIES
-- ============================================

-- Drop the problematic policies first
DROP POLICY IF EXISTS "user_profiles_public_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_delete" ON public.user_profiles;

-- Create correct policies for user_profiles
-- (Table has both id and user_id columns based on your query results)
CREATE POLICY "user_profiles_public_read" ON public.user_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "user_profiles_owner_update" ON public.user_profiles
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR id = auth.uid()
        OR public.is_admin()
    );

-- Fix INSERT policy - must use WITH CHECK, not USING
CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        OR id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "user_profiles_admin_delete" ON public.user_profiles
    FOR DELETE
    USING (public.is_admin());

-- ============================================
-- VERIFY THE FIX
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'User profiles policies have been fixed!';
    RAISE NOTICE 'Testing basic access...';
    
    -- Test that we can select from user_profiles
    PERFORM * FROM public.user_profiles LIMIT 1;
    RAISE NOTICE '✅ SELECT access works';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Error testing user_profiles: %', SQLERRM;
END $$;

-- ============================================
-- QUICK VERIFICATION
-- ============================================

-- Show the policies we just created
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY policyname;