-- Check and clean up existing RLS policies before applying new ones

-- 1. First, let's see what policies already exist
SELECT 
    'EXISTING POLICIES:' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Check which tables have RLS enabled
SELECT 
    'TABLES WITH RLS:' as info,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- 3. Drop all existing policies on tables we need to update
-- This ensures we start fresh with consistent policies

-- Products table
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow service role full access on products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Product variants table
DROP POLICY IF EXISTS "Allow public read access on product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow service role full access on product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public can view active variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;

-- Product images table
DROP POLICY IF EXISTS "Allow public read access on product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow service role full access on product_images" ON public.product_images;

-- Orders table
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;
DROP POLICY IF EXISTS "System can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Order items table
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- Cart items table
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

-- User profiles table
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;

-- Reviews table
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Inventory table
DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;

-- Inventory movements table
DROP POLICY IF EXISTS "Admins can view movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "System can create movements" ON public.inventory_movements;

-- Bundles table
DROP POLICY IF EXISTS "Public can view active bundles" ON public.bundles;
DROP POLICY IF EXISTS "Admins can manage bundles" ON public.bundles;

-- Bundle analytics table
DROP POLICY IF EXISTS "Admins can view bundle analytics" ON public.bundle_analytics;
DROP POLICY IF EXISTS "System can insert bundle analytics" ON public.bundle_analytics;

-- Smart collections table
DROP POLICY IF EXISTS "Public can view active collections" ON public.smart_collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON public.smart_collections;

-- 4. Show status after cleanup
SELECT 
    'POLICIES AFTER CLEANUP:' as info,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_variants', 'product_images',
    'orders', 'order_items', 'cart_items',
    'user_profiles', 'reviews', 'inventory',
    'inventory_movements', 'bundles', 'bundle_analytics',
    'smart_collections'
)
GROUP BY tablename
ORDER BY tablename;