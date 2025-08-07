-- ============================================
-- RLS POLICY VERIFICATION SCRIPT
-- ============================================
-- Run this after the comprehensive RLS fix to verify everything works
-- Use this in Supabase SQL Editor to test your policies

-- ============================================
-- 1. BASIC SYSTEM CHECKS
-- ============================================

SELECT '=== SYSTEM STATUS ===' as section;

-- Check all tables have RLS enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Protected'
        ELSE '❌ NOT Protected - SECURITY RISK!'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory',
    'reviews', 'bundles', 'bundle_analytics', 'inventory_movements'
)
ORDER BY tablename;

-- ============================================
-- 2. POLICY VERIFICATION
-- ============================================

SELECT '=== POLICY SUMMARY ===' as section;

SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as read_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
    COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 3. ADMIN FUNCTION TESTS
-- ============================================

SELECT '=== ADMIN FUNCTION TESTS ===' as section;

-- Test admin functions (will return false if not admin, but shouldn't error)
SELECT 
    'Admin function test' as test_name,
    CASE 
        WHEN public.is_admin() IS NOT NULL THEN '✅ is_admin() function works'
        ELSE '❌ is_admin() function failed'
    END as result;

SELECT 
    'Permission function test' as test_name,
    CASE 
        WHEN public.has_admin_permission('products') IS NOT NULL THEN '✅ has_admin_permission() function works'
        ELSE '❌ has_admin_permission() function failed'
    END as result;

-- ============================================
-- 4. PERMISSION GRANTS CHECK
-- ============================================

SELECT '=== PERMISSION GRANTS ===' as section;

-- Check if anon role has necessary permissions for main site
SELECT 
    'anon role permissions' as check_type,
    string_agg(privilege_type, ', ') as permissions
FROM information_schema.role_table_grants 
WHERE grantee = 'anon' 
AND table_schema = 'public' 
AND table_name IN ('products', 'product_images', 'product_variants')
GROUP BY grantee;

-- Check authenticated role permissions
SELECT 
    'authenticated role permissions' as check_type,
    table_name,
    string_agg(privilege_type, ', ') as permissions
FROM information_schema.role_table_grants 
WHERE grantee = 'authenticated' 
AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 5. TEST QUERIES (Should not error)
-- ============================================

SELECT '=== BASIC ACCESS TESTS ===' as section;

-- Test basic product access (should work for everyone)
DO $$
BEGIN
    PERFORM * FROM public.products LIMIT 1;
    RAISE NOTICE '✅ Products table accessible';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Products table access failed: %', SQLERRM;
END $$;

-- Test product images access
DO $$
BEGIN
    PERFORM * FROM public.product_images LIMIT 1;
    RAISE NOTICE '✅ Product images table accessible';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Product images access failed: %', SQLERRM;
END $$;

-- Test inventory access
DO $$
BEGIN
    PERFORM * FROM public.inventory LIMIT 1;
    RAISE NOTICE '✅ Inventory table accessible';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Inventory access failed: %', SQLERRM;
END $$;

-- Test user profiles access
DO $$
BEGIN
    PERFORM * FROM public.user_profiles LIMIT 1;
    RAISE NOTICE '✅ User profiles table accessible';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ User profiles access failed: %', SQLERRM;
END $$;

-- ============================================
-- 6. ADMIN USERS CHECK
-- ============================================

SELECT '=== ADMIN USERS CHECK ===' as section;

-- Show admin users (if any exist)
SELECT 
    'Admin users count' as info,
    COUNT(*) as total_admins,
    COUNT(*) FILTER (WHERE is_active = true) as active_admins,
    COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins,
    COUNT(*) FILTER (WHERE 'all' = ANY(permissions)) as full_permission_admins
FROM public.admin_users;

-- Show admin user details (if you have permission)
DO $$
BEGIN
    -- Try to access admin users
    IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
        RAISE NOTICE '✅ Admin users table has data';
    ELSE
        RAISE NOTICE '⚠️  No admin users found - you may need to create one first';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Cannot access admin users: %', SQLERRM;
END $$;

-- ============================================
-- 7. COMMON ISSUES DIAGNOSTIC
-- ============================================

SELECT '=== DIAGNOSTIC CHECKS ===' as section;

-- Check for tables without any policies (potential issues)
SELECT 
    'Tables without policies' as issue_type,
    string_agg(tablename, ', ') as problematic_tables
FROM pg_tables t
WHERE schemaname = 'public'
AND rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = t.tablename
)
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory'
);

-- Check for potentially problematic column references in policies
SELECT 
    'Policy column references' as check_type,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%user_id%' AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = pg_policies.tablename 
            AND column_name = 'user_id'
        ) THEN '⚠️  References user_id but column may not exist'
        WHEN qual LIKE '%auth_user_id%' AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = pg_policies.tablename 
            AND column_name = 'auth_user_id'
        ) THEN '⚠️  References auth_user_id but column may not exist'
        ELSE '✅ Column references look OK'
    END as column_check
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%user_id%' OR qual LIKE '%auth_user_id%')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '=== VERIFICATION COMPLETE ===' as section;

SELECT 
    'If you see this message without errors above, your RLS policies are working correctly!' as status,
    'Next steps: Test with your application using both anon and authenticated requests' as next_action;

-- ============================================
-- TROUBLESHOOTING GUIDE
-- ============================================

/*
TROUBLESHOOTING COMMON ISSUES:

1. If you get "permission denied" errors:
   - Check that the user has the necessary GRANT permissions
   - Verify the user is properly authenticated
   - Make sure admin_users table contains the user record

2. If you get "policy violation" errors:
   - Check that policies exist for the operation you're trying
   - Verify the policy conditions match your user context
   - Look at the actual policy SQL in pg_policies table

3. If admin functions return NULL:
   - Make sure the admin_users table exists and has data
   - Check that the user_id in admin_users matches auth.uid()
   - Verify is_active = true for the admin user

4. For testing different roles:
   - Use anon key for public access (main site)
   - Use authenticated user JWT for user operations
   - Make sure admin users have proper permissions array

5. If specific tables still give errors:
   - Check the table exists: SELECT * FROM information_schema.tables WHERE table_name = 'tablename';
   - Check column structure: SELECT * FROM information_schema.columns WHERE table_name = 'tablename';
   - Test with a simpler policy first

TESTING WITH DIFFERENT KEYS:
- Anon key: Should access products, product_images, product_variants, inventory (read-only)
- User JWT: Should access their own profiles, cart, orders
- Admin JWT: Should access everything based on permissions
*/