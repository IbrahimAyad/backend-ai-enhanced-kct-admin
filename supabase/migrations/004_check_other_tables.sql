-- Check schema for other important tables before applying RLS

-- 1. Check orders table structure
SELECT '=== ORDERS TABLE ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check cart_items table structure
SELECT '=== CART_ITEMS TABLE ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- 3. Check if user_profiles table exists
SELECT '=== USER_PROFILES TABLE ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Check if wishlists table exists
SELECT '=== WISHLISTS TABLE ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'wishlists'
ORDER BY ordinal_position;

-- 5. Check products table
SELECT '=== PRODUCTS TABLE ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- 6. List all tables in public schema
SELECT '=== ALL TABLES IN PUBLIC SCHEMA ===' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7. Check which tables already have RLS enabled
SELECT '=== TABLES WITH RLS ENABLED ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;