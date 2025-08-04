-- Simple query to check orders table structure and data

-- 1. Show ALL columns in orders table
SELECT 
    ordinal_position,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check if there's any data in orders
SELECT COUNT(*) as total_orders FROM public.orders;

-- 3. Look at a sample order (if any exist)
SELECT * FROM public.orders LIMIT 1;

-- 4. Check what columns might link to users/customers
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND (
    column_name LIKE '%user%' 
    OR column_name LIKE '%customer%'
    OR column_name LIKE '%email%'
    OR column_name LIKE '%auth%'
)
ORDER BY ordinal_position;