-- Safe RLS policies fix - checks for existing policies first
-- Run this in Supabase SQL Editor

-- 1. Fix products table access
DO $$ 
BEGIN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
    DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
    DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
    
    -- Create new policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'Anyone can view products'
    ) THEN
        CREATE POLICY "Anyone can view products" ON public.products
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'Admins can manage products'
    ) THEN
        CREATE POLICY "Admins can manage products" ON public.products
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    END IF;
END $$;

-- 2. Check what happened with products
SELECT 'Products policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products';

-- 3. Fix cart_items access
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;
    DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
    DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
END $$;

-- 4. Fix user_profiles (skip if already exists)
DO $$ 
BEGIN
    -- Only drop/create if needed
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can manage own profile'
    ) THEN
        RAISE NOTICE 'User profile policies already exist - skipping';
    ELSE
        DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
        
        CREATE POLICY "Users can view any profile" ON public.user_profiles
            FOR SELECT
            USING (true);

        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL
            USING (
                auth.uid() = user_id
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    END IF;
END $$;

-- 5. Create functions only if they don't exist
DO $$ 
BEGIN
    -- Check if get_cart_items exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_cart_items'
    ) THEN
        CREATE FUNCTION get_cart_items()
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            RETURN COALESCE(
                (SELECT json_agg(row_to_json(t))
                 FROM (
                     SELECT 
                         ci.*,
                         p.name as product_name,
                         p.base_price as product_price
                     FROM cart_items ci
                     JOIN products p ON ci.product_id = p.id
                     WHERE ci.user_id = auth.uid()
                     OR ci.session_id = current_setting('app.session_id', true)
                 ) t),
                '[]'::json
            );
        END;
        $func$;
        
        GRANT EXECUTE ON FUNCTION get_cart_items() TO authenticated;
    END IF;
END $$;

-- 6. Fix get_low_stock_products function
DROP FUNCTION IF EXISTS get_low_stock_products(integer);

CREATE OR REPLACE FUNCTION get_low_stock_products(threshold integer DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if product_variants table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
        RETURN '[]'::json;
    END IF;
    
    -- Return low stock products
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 p.id,
                 p.name as product_name,
                 p.sku,
                 COALESCE(SUM(pv.stock_quantity), 0) as stock_level,
                 0 as reserved_quantity,
                 COALESCE(SUM(pv.stock_quantity), 0) as available_quantity
             FROM products p
             LEFT JOIN product_variants pv ON p.id = pv.product_id
             GROUP BY p.id, p.name, p.sku
             HAVING COALESCE(SUM(pv.stock_quantity), 0) < threshold
             ORDER BY stock_level ASC
         ) t),
        '[]'::json
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_low_stock_products(integer) TO authenticated;

-- 7. Check admin user
SELECT 
    'Admin user status:' as info,
    au.user_id,
    au.email,
    au.is_active,
    au.permissions
FROM admin_users au
WHERE au.email = 'admin@kctmenswear.com';

-- 8. Check all policies
SELECT 
    'Current policies:' as info;
    
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('products', 'user_profiles', 'cart_items', 'inventory', 'reviews')
ORDER BY tablename, policyname;

-- 9. Test if products are accessible
SELECT 
    'Products access test:' as info,
    COUNT(*) as product_count
FROM products;