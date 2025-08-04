-- System Health Check - Run this to verify your security setup

-- 1. Check all tables with RLS
SELECT 
    'Tables with RLS:' as check_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE rowsecurity = true) as protected,
    COUNT(*) FILTER (WHERE rowsecurity = false) as unprotected
FROM pg_tables
WHERE schemaname = 'public';

-- 2. Check security policies by table
SELECT 
    'Security Policies:' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- 3. Check admin users
SELECT 
    'Admin Users:' as check_type,
    COUNT(*) as total_admins,
    COUNT(*) FILTER (WHERE is_active = true) as active_admins,
    COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins
FROM public.admin_users;

-- 4. Check critical tables exist
SELECT 
    'Critical Tables:' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Protected'
        ELSE '⚠️  Not Protected'
    END as security_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'customers', 'orders', 'products', 'inventory',
    'admin_users', 'email_logs', 'order_status_history',
    'inventory_reservations', 'customer_segments'
)
ORDER BY tablename;

-- 5. Check for any unprotected tables that should be protected
SELECT 
    'Unprotected Tables:' as check_type,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT IN (
    -- System tables that don't need RLS
    'schema_migrations',
    'spatial_ref_sys'
)
AND tablename NOT LIKE '%_analytics%' -- Analytics tables may not need RLS
ORDER BY tablename;