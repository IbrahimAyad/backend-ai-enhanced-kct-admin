-- Fix RLS policies for admin access
-- Run this in Supabase SQL Editor

-- 1. Fix products table access
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 2. Fix inventory table access (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
        
        -- Create new policies
        EXECUTE 'CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true))';
    END IF;
END $$;

-- 3. Fix cart_items access
DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;

CREATE POLICY "Users can view own cart items" ON public.cart_items
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR session_id = current_setting('app.session_id', true)
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL
    USING (
        auth.uid() = user_id 
        OR session_id = current_setting('app.session_id', true)
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 4. Fix user_profiles access
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

-- 5. Fix reviews table access
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 6. Create get_cart_items function if missing
CREATE OR REPLACE FUNCTION get_cart_items()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 7. Fix get_low_stock_products function
DROP FUNCTION IF EXISTS get_low_stock_products(integer);

CREATE OR REPLACE FUNCTION get_low_stock_products(threshold integer DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return empty array if inventory table doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        RETURN '[]'::json;
    END IF;
    
    -- Otherwise return low stock products
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_cart_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_products(integer) TO authenticated;

-- 8. Verify admin user exists and is active
SELECT 
    au.user_id,
    au.email,
    au.is_active,
    au.permissions,
    u.email as auth_email
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'admin@kctmenswear.com';

-- 9. Check current user
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email,
    auth.role() as current_role;