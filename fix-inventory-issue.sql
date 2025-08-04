-- Fix the inventory table issue
-- Run this in Supabase SQL Editor

-- 1. Check if inventory is a table or view
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'inventory';

-- 2. Disable RLS on inventory table
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;

-- 3. Check what's in the inventory table
SELECT 'Inventory table contents:' as info;
SELECT COUNT(*) as inventory_count FROM inventory;

-- 4. If inventory table is empty, populate it from product_variants
INSERT INTO inventory (product_id, variant_id, quantity, reserved_quantity, available_quantity)
SELECT 
    pv.product_id,
    pv.id as variant_id,
    COALESCE(pv.stock_quantity, 0) as quantity,
    COALESCE(pv.reserved_quantity, 0) as reserved_quantity,
    COALESCE(pv.stock_quantity, 0) - COALESCE(pv.reserved_quantity, 0) as available_quantity
FROM product_variants pv
WHERE NOT EXISTS (
    SELECT 1 FROM inventory i 
    WHERE i.variant_id = pv.id
);

-- 5. Show final status
SELECT 'Final data counts:' as status;
SELECT 'Products:' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Product Variants:', COUNT(*) FROM product_variants
UNION ALL
SELECT 'Inventory Records:', COUNT(*) FROM inventory
UNION ALL
SELECT 'Customers:', COUNT(*) FROM customers
UNION ALL
SELECT 'Orders:', COUNT(*) FROM orders;

-- 6. Test the get_low_stock_products function
SELECT 'Testing low stock function:' as test;
SELECT get_low_stock_products(50); -- Show products with less than 50 stock

-- 7. Show RLS status for all tables
SELECT 
    'RLS Status:' as info;
    
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'customers', 'orders', 'inventory', 'cart_items', 'user_profiles')
ORDER BY tablename;