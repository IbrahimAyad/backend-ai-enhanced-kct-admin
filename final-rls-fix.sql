-- Final RLS fix - Comprehensive solution
-- Run this in Supabase SQL Editor

-- 1. First check if user_profiles table has correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- 2. Fix user_profiles policies (406 errors)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
    END LOOP;
END $$;

-- Create simple policies
CREATE POLICY "Enable read access for all users" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Fix products access (403 errors)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop and recreate products policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'products' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Allow public read" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Fix cart_items (403 errors)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cart_items' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cart_items', pol.policyname);
    END LOOP;
END $$;

-- Create RPC function for cart items instead
CREATE OR REPLACE FUNCTION get_cart_items()
RETURNS SETOF cart_items
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM cart_items 
    WHERE user_id = auth.uid() 
    OR user_id IS NULL;
$$;

-- 5. Fix inventory table (400 errors)
-- Check if inventory table exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory'
    ) THEN
        -- Create a basic inventory view from product_variants
        CREATE VIEW inventory AS
        SELECT 
            pv.id,
            pv.product_id,
            pv.id as variant_id,
            COALESCE(pv.stock_quantity, 0) as quantity,
            COALESCE(pv.reserved_quantity, 0) as reserved_quantity,
            COALESCE(pv.stock_quantity, 0) - COALESCE(pv.reserved_quantity, 0) as available_quantity
        FROM product_variants pv;
    END IF;
END $$;

-- 6. Update get_low_stock_products to handle missing inventory
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold integer DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 p.id,
                 p.name as product_name,
                 p.sku,
                 COALESCE(p.total_inventory, 0) as stock_level,
                 0 as reserved_quantity,
                 COALESCE(p.total_inventory, 0) as available_quantity
             FROM products p
             WHERE COALESCE(p.total_inventory, 0) < threshold
             ORDER BY p.total_inventory ASC
             LIMIT 10
         ) t),
        '[]'::json
    );
END;
$$;

-- 7. Grant necessary permissions
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_cart_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_products(integer) TO authenticated;

-- 8. Verify current user is authenticated
SELECT 
    auth.uid() as user_id,
    auth.email() as email,
    auth.role() as role,
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
    ) as is_admin;

-- 9. Show final policy status
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'user_profiles', 'cart_items', 'orders')
GROUP BY tablename
ORDER BY tablename;