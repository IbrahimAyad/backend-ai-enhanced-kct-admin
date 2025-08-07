-- PRE-MIGRATION SAFETY CHECK
-- Run this BEFORE the main RLS migration to verify current state

-- 1. Check current RLS status
SELECT 
    'Current RLS Status' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as current_policies
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory'
)
ORDER BY tablename;

-- 2. Check current admin users (ensure you have access)
SELECT 
    'Admin Users Check' as check_type,
    COUNT(*) as admin_count,
    STRING_AGG(DISTINCT role, ', ') as roles_present
FROM public.admin_users 
WHERE is_active = true;

-- 3. Verify essential columns exist
SELECT 
    'Column Check' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('admin_users', 'customers', 'user_profiles')
AND column_name IN ('user_id', 'auth_user_id', 'is_active', 'role', 'permissions')
ORDER BY table_name, column_name;

-- 4. Check current policy names (will be dropped)
SELECT 
    'Current Policies' as check_type,
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;