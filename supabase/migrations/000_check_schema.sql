-- This script helps you check the actual database schema
-- Run each query separately to understand your current table structure

-- 1. Check if tables exist and their columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN (
    'customers',
    'orders',
    'order_items',
    'cart_items',
    'user_profiles',
    'wishlists',
    'products',
    'product_variants',
    'inventory'
)
ORDER BY table_name, ordinal_position;

-- 2. Check specifically for auth-related columns in customers table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
AND (column_name LIKE '%auth%' OR column_name LIKE '%user%');

-- 3. Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('customers', 'orders', 'cart_items', 'user_profiles', 'wishlists');

-- 4. Check if RLS is already enabled on any tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'customers',
    'orders',
    'order_items',
    'cart_items',
    'user_profiles',
    'wishlists',
    'products',
    'product_variants',
    'inventory'
);

-- 5. Check existing policies (if any)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;