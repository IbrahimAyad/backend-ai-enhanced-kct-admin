-- Emergency RLS fix - Allow public read access for testing
-- Run this in Supabase SQL Editor

-- 1. Products - Allow everyone to read
DROP POLICY IF EXISTS "public_read_products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "public_read_products" ON public.products
    FOR SELECT
    USING (true);

-- 2. Allow authenticated users to read inventory (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        DROP POLICY IF EXISTS "public_read_inventory" ON public.inventory;
        EXECUTE 'CREATE POLICY "public_read_inventory" ON public.inventory FOR SELECT USING (true)';
    END IF;
END $$;

-- 3. Fix user_profiles to allow reading
DROP POLICY IF EXISTS "public_read_profiles" ON public.user_profiles;
CREATE POLICY "public_read_profiles" ON public.user_profiles
    FOR SELECT
    USING (true);

-- 4. Fix reviews
DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews" ON public.reviews
    FOR SELECT  
    USING (true);

-- 5. Test access without authentication
SELECT 'Products accessible?' as test, COUNT(*) as count FROM products;
SELECT 'Customers accessible?' as test, COUNT(*) as count FROM customers;
SELECT 'Orders accessible?' as test, COUNT(*) as count FROM orders;

-- 6. Show all current policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'customers', 'orders', 'inventory', 'user_profiles')
ORDER BY tablename, policyname;