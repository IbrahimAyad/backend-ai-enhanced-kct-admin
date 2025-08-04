-- Debug authentication and RLS issues
-- Run this in Supabase SQL Editor

-- 1. Check if you're authenticated when running queries
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email,
    auth.role() as current_role,
    current_setting('request.jwt.claims', true)::json->>'sub' as jwt_sub;

-- 2. Check if the current user is an admin
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        ) THEN 'YES - User is admin'
        ELSE 'NO - User is not admin'
    END as is_admin,
    au.*
FROM admin_users au
WHERE au.user_id = auth.uid();

-- 3. Test products access directly
SELECT 
    'Direct products access test:' as test;
    
SELECT COUNT(*) as can_access_products
FROM products
WHERE true; -- This should work if "Anyone can view products" policy exists

-- 4. Check all RLS policies on products
SELECT 
    'Products RLS policies:' as info;
    
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'products';

-- 5. Check if RLS is enabled
SELECT 
    'RLS enabled status:' as info;
    
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'cart_items', 'user_profiles', 'inventory');

-- 6. Force enable RLS and recreate policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Drop ALL policies and recreate for products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;

-- Create a simple public read policy
CREATE POLICY "public_read_products" ON public.products
    FOR SELECT
    USING (true);

-- Create admin write policy  
CREATE POLICY "admin_write_products" ON public.products
    FOR INSERT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "admin_update_products" ON public.products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "admin_delete_products" ON public.products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 8. Test again
SELECT 'Final test - can access products?' as test, COUNT(*) from products;