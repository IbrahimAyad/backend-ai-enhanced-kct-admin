-- ============================================
-- CHECK CURRENT DATABASE STATE
-- ============================================

-- 1. Show all policies in detail
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'product_images', 'product_variants', 'user_profiles')
ORDER BY tablename, policyname;

-- 2. Check if admin user exists
SELECT 
    'Admin User Check' as info,
    au.user_id,
    au.email,
    au.role,
    au.is_active,
    au.permissions,
    u.email as auth_email
FROM public.admin_users au
LEFT JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'admin@kctmenswear.com' 
   OR au.email = 'admin@kctmenswear.com';

-- 3. If no admin found, check auth.users
SELECT 
    'Auth Users Check' as info,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'admin@kctmenswear.com';

-- 4. Test if functions work
SELECT 
    'Function Tests' as test_type,
    public.is_admin() as is_current_user_admin,
    auth.uid() as current_user_id;

-- 5. Count data in tables
SELECT 
    'Table Data Counts' as info,
    (SELECT COUNT(*) FROM public.products) as products_count,
    (SELECT COUNT(*) FROM public.product_images) as images_count,
    (SELECT COUNT(*) FROM public.product_variants) as variants_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;

-- 6. Show a sample product to verify data exists
SELECT 
    id,
    name,
    status,
    created_at
FROM public.products
LIMIT 3;