-- AUTHENTICATION SYSTEM TESTS
-- Run these tests to verify the authentication recovery is working
-- Execute in Supabase SQL Editor

-- =============================================================================
-- TEST 1: Basic connectivity and RLS status
-- =============================================================================

SELECT 'TEST 1: RLS STATUS CHECK' as test_name;

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'products', 'customers', 'orders')
ORDER BY tablename;

-- =============================================================================
-- TEST 2: Admin users table accessibility
-- =============================================================================

SELECT 'TEST 2: ADMIN USERS ACCESSIBILITY' as test_name;

-- Test if we can query admin_users without circular dependency
DO $$
DECLARE
    admin_count INTEGER;
    test_result TEXT;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO admin_count FROM public.admin_users;
        test_result := '✅ SUCCESS: Can query admin_users table (' || admin_count || ' records)';
    EXCEPTION
        WHEN others THEN
            test_result := '❌ FAILED: Cannot query admin_users - ' || SQLERRM;
    END;
    
    RAISE NOTICE '%', test_result;
END $$;

-- =============================================================================
-- TEST 3: RLS policies verification
-- =============================================================================

SELECT 'TEST 3: RLS POLICIES CHECK' as test_name;

WITH policy_check AS (
    SELECT 
        tablename,
        policyname,
        cmd,
        CASE 
            WHEN policyname ILIKE '%circular%' OR policyname ILIKE '%admin%check%admin%' THEN 'POTENTIALLY_CIRCULAR'
            WHEN qual ILIKE '%EXISTS%admin_users%auth.uid%admin_users%' THEN 'LIKELY_CIRCULAR'
            ELSE 'OK'
        END as circular_risk
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users'
)
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN circular_risk = 'POTENTIALLY_CIRCULAR' THEN '⚠️ POTENTIAL CIRCULAR DEPENDENCY'
        WHEN circular_risk = 'LIKELY_CIRCULAR' THEN '❌ LIKELY CIRCULAR DEPENDENCY'
        ELSE '✅ POLICY OK'
    END as status
FROM policy_check;

-- =============================================================================
-- TEST 4: Admin users data verification
-- =============================================================================

SELECT 'TEST 4: ADMIN USERS DATA' as test_name;

SELECT 
    au.id,
    au.role,
    au.is_active,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    CASE 
        WHEN au.is_active AND u.email_confirmed_at IS NOT NULL THEN '✅ READY'
        WHEN NOT au.is_active THEN '❌ INACTIVE'
        WHEN u.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
        ELSE '❓ UNKNOWN STATUS'
    END as status
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at;

-- =============================================================================
-- TEST 5: Authentication simulation
-- =============================================================================

SELECT 'TEST 5: AUTHENTICATION FLOW SIMULATION' as test_name;

-- Simulate the authentication flow that the frontend would use
DO $$
DECLARE
    test_user_id UUID;
    admin_check_result RECORD;
    auth_simulation_result TEXT;
BEGIN
    -- Get a test admin user ID
    SELECT user_id INTO test_user_id 
    FROM public.admin_users 
    WHERE is_active = true 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ NO ADMIN USERS FOUND - Cannot simulate authentication';
        RETURN;
    END IF;
    
    -- Simulate the admin check query (what useAdminAuth hook does)
    BEGIN
        -- This is the exact query from useAdminAuth
        SELECT * INTO admin_check_result
        FROM public.admin_users
        WHERE user_id = test_user_id
        AND is_active = true;
        
        IF admin_check_result IS NOT NULL THEN
            auth_simulation_result := '✅ SUCCESS: Admin authentication would work for user ' || test_user_id;
        ELSE
            auth_simulation_result := '❌ FAILED: No admin record found for user ' || test_user_id;
        END IF;
        
    EXCEPTION
        WHEN others THEN
            auth_simulation_result := '❌ FAILED: Authentication query failed - ' || SQLERRM;
    END;
    
    RAISE NOTICE '%', auth_simulation_result;
END $$;

-- =============================================================================
-- TEST 6: Product table accessibility (critical for app)
-- =============================================================================

SELECT 'TEST 6: PRODUCT TABLE ACCESS' as test_name;

DO $$
DECLARE
    product_count INTEGER;
    access_result TEXT;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO product_count FROM public.products LIMIT 1;
        access_result := '✅ SUCCESS: Products table accessible (' || product_count || ' products)';
    EXCEPTION
        WHEN others THEN
            access_result := '❌ FAILED: Cannot access products table - ' || SQLERRM;
    END;
    
    RAISE NOTICE '%', access_result;
END $$;

-- =============================================================================
-- TEST 7: Overall system health check
-- =============================================================================

SELECT 'TEST 7: SYSTEM HEALTH SUMMARY' as test_name;

DO $$
DECLARE
    total_tests INTEGER := 7;
    passed_tests INTEGER := 0;
    admin_users_accessible BOOLEAN := false;
    products_accessible BOOLEAN := false;
    has_active_admins BOOLEAN := false;
    health_status TEXT;
BEGIN
    -- Test admin_users accessibility
    BEGIN
        PERFORM COUNT(*) FROM public.admin_users;
        admin_users_accessible := true;
        passed_tests := passed_tests + 1;
    EXCEPTION
        WHEN others THEN
            admin_users_accessible := false;
    END;
    
    -- Test products accessibility
    BEGIN
        PERFORM COUNT(*) FROM public.products;
        products_accessible := true;
        passed_tests := passed_tests + 1;
    EXCEPTION
        WHEN others THEN
            products_accessible := false;
    END;
    
    -- Test for active admin users
    SELECT EXISTS(
        SELECT 1 FROM public.admin_users au
        JOIN auth.users u ON au.user_id = u.id
        WHERE au.is_active = true 
        AND u.email_confirmed_at IS NOT NULL
    ) INTO has_active_admins;
    
    IF has_active_admins THEN
        passed_tests := passed_tests + 1;
    END IF;
    
    -- Determine overall health
    IF passed_tests >= 3 THEN
        health_status := '✅ SYSTEM HEALTHY - Authentication should work';
    ELSIF passed_tests >= 2 THEN
        health_status := '⚠️ SYSTEM PARTIALLY HEALTHY - Some issues detected';
    ELSE
        health_status := '❌ SYSTEM UNHEALTHY - Major issues detected';
    END IF;
    
    RAISE NOTICE '=== SYSTEM HEALTH SUMMARY ===';
    RAISE NOTICE 'Admin Users Accessible: %', CASE WHEN admin_users_accessible THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'Products Accessible: %', CASE WHEN products_accessible THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'Has Active Admins: %', CASE WHEN has_active_admins THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'Overall Status: %', health_status;
    RAISE NOTICE 'Tests Passed: %/%', passed_tests, total_tests;
END $$;

-- =============================================================================
-- TEST RESULTS AND RECOMMENDATIONS
-- =============================================================================

SELECT 'RECOMMENDATIONS BASED ON TEST RESULTS' as test_name;

DO $$
DECLARE
    admin_count INTEGER;
    active_admin_count INTEGER;
    rls_enabled_count INTEGER;
    recommendations TEXT[];
BEGIN
    -- Gather test data
    SELECT COUNT(*) INTO admin_count FROM public.admin_users;
    
    SELECT COUNT(*) INTO active_admin_count 
    FROM public.admin_users au
    JOIN auth.users u ON au.user_id = u.id
    WHERE au.is_active = true AND u.email_confirmed_at IS NOT NULL;
    
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename IN ('admin_users', 'products', 'customers', 'orders')
    AND rowsecurity = true;
    
    -- Generate recommendations
    recommendations := ARRAY[]::TEXT[];
    
    IF admin_count = 0 THEN
        recommendations := recommendations || ARRAY['❌ CRITICAL: No admin users found - run emergency admin creation script'];
    ELSIF active_admin_count = 0 THEN
        recommendations := recommendations || ARRAY['❌ CRITICAL: No active admin users - activate existing admins or create new ones'];
    ELSE
        recommendations := recommendations || ARRAY['✅ GOOD: Active admin users found'];
    END IF;
    
    IF rls_enabled_count < 4 THEN
        recommendations := recommendations || ARRAY['⚠️ WARNING: Some tables missing RLS protection'];
    ELSE
        recommendations := recommendations || ARRAY['✅ GOOD: RLS enabled on critical tables'];
    END IF;
    
    -- Additional checks
    IF EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND qual ILIKE '%admin_users%auth.uid%admin_users%') THEN
        recommendations := recommendations || ARRAY['❌ CRITICAL: Circular RLS policies detected - fix immediately'];
    ELSE
        recommendations := recommendations || ARRAY['✅ GOOD: No obvious circular RLS dependencies'];
    END IF;
    
    -- Print recommendations
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    FOR i IN 1..array_length(recommendations, 1) LOOP
        RAISE NOTICE '%', recommendations[i];
    END LOOP;
    
    -- Final action items
    RAISE NOTICE '';
    RAISE NOTICE '=== IMMEDIATE ACTION ITEMS ===';
    IF active_admin_count > 0 THEN
        RAISE NOTICE '1. ✅ Test admin login in browser';
        RAISE NOTICE '2. ✅ Verify admin dashboard loads';
        RAISE NOTICE '3. ✅ Test admin permissions';
    ELSE
        RAISE NOTICE '1. ❌ Create/activate admin users first';
        RAISE NOTICE '2. ❌ Then test authentication';
    END IF;
    RAISE NOTICE '4. Monitor Supabase logs for errors';
    RAISE NOTICE '5. Test on both main and preview URLs';
END $$;

-- =============================================================================
-- FINAL TEST: Try the exact query that frontend uses
-- =============================================================================

SELECT 'FRONTEND COMPATIBILITY TEST' as test_name;

-- This simulates the exact queries the frontend makes
SELECT 
    'Frontend Query Test' as test_type,
    COUNT(*) as admin_count,
    'Query executed successfully' as result
FROM public.admin_users
WHERE user_id = '00000000-0000-0000-0000-000000000000'  -- Dummy UUID for test
AND is_active = true;

RAISE NOTICE 'If you see results above without errors, frontend authentication should work!';
RAISE NOTICE '';
RAISE NOTICE '=== NEXT STEPS ===';
RAISE NOTICE '1. Open your application in browser';
RAISE NOTICE '2. Try logging in with admin credentials';
RAISE NOTICE '3. Check browser console for any errors';
RAISE NOTICE '4. Verify admin dashboard functionality';
RAISE NOTICE '5. If issues persist, run EMERGENCY_ROLLBACK.sql';