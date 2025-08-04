-- Quick check to see all existing tables and their structure
-- Run this in Supabase SQL Editor

-- 1. List all tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ No RLS'
    END as security
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check if specific tables we need exist
SELECT 
    'Required Tables Check:' as category,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') 
         THEN '✅ products' ELSE '❌ products' END as products,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variants') 
         THEN '✅ product_variants' ELSE '❌ product_variants' END as variants,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') 
         THEN '✅ orders' ELSE '❌ orders' END as orders,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') 
         THEN '✅ order_items' ELSE '❌ order_items' END as order_items,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') 
         THEN '✅ customers' ELSE '❌ customers' END as customers,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') 
         THEN '✅ inventory' ELSE '❌ inventory' END as inventory;

-- 3. Check sample data counts
SELECT 
    'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers  
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;