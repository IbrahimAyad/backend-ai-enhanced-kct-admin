-- Check structure of critical tables that need RLS

-- 1. ORDERS table (currently no RLS)
SELECT 'ORDERS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
AND column_name IN ('id', 'customer_id', 'user_id', 'guest_email', 'status')
ORDER BY ordinal_position;

-- 2. CART_ITEMS table (currently no RLS)
SELECT 'CART_ITEMS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cart_items'
AND column_name IN ('id', 'user_id', 'customer_id', 'session_id', 'product_id')
ORDER BY ordinal_position;

-- 3. USER_PROFILES table (currently no RLS)
SELECT 'USER_PROFILES TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
AND column_name IN ('id', 'user_id', 'auth_user_id', 'email')
ORDER BY ordinal_position;

-- 4. PRODUCTS table (currently no RLS)
SELECT 'PRODUCTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
AND column_name IN ('id', 'status', 'is_active', 'visibility')
ORDER BY ordinal_position;

-- 5. Check foreign key relationships for orders table
SELECT 'ORDERS TABLE FOREIGN KEYS:' as info;
SELECT
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'orders';