-- EMERGENCY ROLLBACK SCRIPT
-- Use this if the authentication fixes cause problems
-- Run this in Supabase SQL Editor to restore previous state

BEGIN;

-- =============================================================================
-- ROLLBACK STEP 1: Temporarily disable RLS to restore access
-- =============================================================================

-- Disable RLS on admin_users to allow emergency access
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

RAISE NOTICE 'ROLLBACK: Disabled RLS on admin_users table';

-- =============================================================================
-- ROLLBACK STEP 2: Verify admin users can be accessed
-- =============================================================================

-- Check if admin users exist and are accessible
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admin_users WHERE is_active = true;
    RAISE NOTICE 'ROLLBACK: Found % active admin users', admin_count;
    
    IF admin_count = 0 THEN
        RAISE WARNING 'ROLLBACK: No active admin users found - creating emergency admin';
        
        -- Create emergency admin if none exist
        INSERT INTO public.admin_users (
            user_id,
            role,
            permissions,
            is_active
        )
        SELECT 
            id,
            'super_admin',
            ARRAY['all'],
            true
        FROM auth.users
        WHERE email ILIKE '%admin%' OR email ILIKE '%support%'
        LIMIT 1
        ON CONFLICT (user_id) DO UPDATE SET
            is_active = true,
            role = 'super_admin',
            permissions = ARRAY['all'];
    END IF;
END $$;

-- =============================================================================
-- ROLLBACK STEP 3: Create temporary, permissive RLS policies
-- =============================================================================

-- Re-enable RLS with very permissive policies for emergency access
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop any restrictive policies
DROP POLICY IF EXISTS "authenticated_users_can_check_admin_status" ON public.admin_users;
DROP POLICY IF EXISTS "service_role_manages_admins" ON public.admin_users;

-- Create temporary emergency policy (very permissive)
CREATE POLICY "emergency_admin_access" ON public.admin_users
    FOR ALL 
    USING (true)  -- Allow all operations for emergency access
    WITH CHECK (true);

RAISE NOTICE 'ROLLBACK: Created emergency access policy';

-- =============================================================================
-- ROLLBACK STEP 4: Verify other critical tables
-- =============================================================================

-- Check if products table is accessible (critical for app functionality)
DO $$
DECLARE
    products_accessible BOOLEAN := false;
    product_count INTEGER := 0;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO product_count FROM public.products LIMIT 1;
        products_accessible := true;
    EXCEPTION
        WHEN others THEN
            products_accessible := false;
    END;
    
    IF NOT products_accessible THEN
        RAISE WARNING 'ROLLBACK: Products table not accessible - fixing...';
        
        -- Ensure products are publicly readable
        DROP POLICY IF EXISTS "public_read_products" ON public.products;
        CREATE POLICY "emergency_product_access" ON public.products
            FOR SELECT
            USING (true);
    ELSE
        RAISE NOTICE 'ROLLBACK: Products table accessible (% products)', product_count;
    END IF;
END $$;

-- =============================================================================
-- ROLLBACK STEP 5: Display current state
-- =============================================================================

-- Show current admin users
SELECT 
    'CURRENT ADMIN USERS' as info,
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at;

-- Show current policies on admin_users
SELECT 
    'CURRENT RLS POLICIES' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- Show RLS status for critical tables
SELECT 
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'products', 'customers', 'orders')
ORDER BY tablename;

COMMIT;

-- =============================================================================
-- POST-ROLLBACK INSTRUCTIONS
-- =============================================================================

/*
AFTER RUNNING THIS ROLLBACK SCRIPT:

1. IMMEDIATE TESTING (next 5 minutes):
   - Try logging in with any existing admin credentials
   - Verify admin dashboard loads
   - Check that products are visible
   - Test basic functionality

2. IF ROLLBACK SUCCESSFUL:
   - Admin access should be restored
   - App should function normally
   - Note: Security is temporarily reduced - fix this ASAP

3. IF ROLLBACK FAILS:
   - Check Supabase logs for any remaining errors
   - Consider contacting Supabase support
   - Use deployment preview URLs as fallback

4. NEXT STEPS FOR PERMANENT FIX:
   - Identify what went wrong with the original fix
   - Test fixes on a development/staging environment first
   - Gradually re-enable proper RLS policies
   - Monitor authentication flows carefully

5. SECURITY NOTES:
   - This rollback uses very permissive policies
   - This is NOT suitable for production long-term
   - Implement proper security as soon as possible
   - Monitor for any suspicious activity

EMERGENCY CONTACTS:
- If this is a production emergency, consider:
  - Notifying stakeholders about temporary security reduction
  - Setting up monitoring for unusual activity
  - Planning immediate security hardening

Remember: This rollback prioritizes availability over security.
Restore proper security measures as soon as possible.
*/