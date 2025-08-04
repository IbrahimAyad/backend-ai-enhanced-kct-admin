-- Complete RLS implementation for all remaining tables
-- This migration handles all tables that currently don't have RLS enabled

-- ============================================
-- 1. CART_ITEMS TABLE
-- ============================================
DO $$
BEGIN
    -- Check if user_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.cart_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
        CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
    END IF;
END $$;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;

-- Users can manage their own cart items
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL
    USING (
        user_id = auth.uid() 
        OR (user_id IS NULL AND session_id IS NOT NULL) -- Guest carts
    );

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Everyone can view active products
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT
    USING (
        status = 'active'
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Only admins can modify products
CREATE POLICY "Admins can manage products" ON public.products
    FOR INSERT OR UPDATE OR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['products'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 3. INVENTORY TABLE
-- ============================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;

-- Public can view inventory levels (for stock checking)
CREATE POLICY "Public can view inventory" ON public.inventory
    FOR SELECT
    USING (true);

-- Only admins can modify inventory
CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR INSERT OR UPDATE OR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['inventory'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 4. INVENTORY_MOVEMENTS TABLE
-- ============================================
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "System can create movements" ON public.inventory_movements;

-- Only admins can view inventory movements
CREATE POLICY "Admins can view movements" ON public.inventory_movements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['inventory'] OR permissions @> ARRAY['all'])
        )
    );

-- System/triggers can create movements
CREATE POLICY "System can create movements" ON public.inventory_movements
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 5. USER_PROFILES TABLE
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;

-- Check the primary key column name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
    ) THEN
        -- If user_id exists, use it
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL
            USING (user_id = auth.uid());
    ELSE
        -- Otherwise assume 'id' is the user reference
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL
            USING (id = auth.uid());
    END IF;
END $$;

-- ============================================
-- 6. REVIEWS TABLE
-- ============================================
-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT
    USING (
        (status = 'approved' OR status IS NULL)
        OR (user_id = auth.uid() AND user_id IS NOT NULL)
        OR (customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        ))
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Users can create and edit their own reviews
CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR INSERT OR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        user_id = auth.uid()
        OR customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['reviews'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 7. BUNDLES TABLE
-- ============================================
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active bundles" ON public.bundles;
DROP POLICY IF EXISTS "Admins can manage bundles" ON public.bundles;

-- Check if bundles has is_active or status column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bundles' 
        AND column_name = 'is_active'
    ) THEN
        CREATE POLICY "Public can view active bundles" ON public.bundles
            FOR SELECT
            USING (
                is_active = true
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bundles' 
        AND column_name = 'status'
    ) THEN
        CREATE POLICY "Public can view active bundles" ON public.bundles
            FOR SELECT
            USING (
                status = 'active'
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    ELSE
        -- If no status column, just allow public read
        CREATE POLICY "Public can view active bundles" ON public.bundles
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Admins can manage bundles
CREATE POLICY "Admins can manage bundles" ON public.bundles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['products'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 8. BUNDLE_ANALYTICS TABLE
-- ============================================
ALTER TABLE public.bundle_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view bundle analytics" ON public.bundle_analytics;

-- Only admins can view analytics
CREATE POLICY "Admins can view bundle analytics" ON public.bundle_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['analytics'] OR permissions @> ARRAY['all'])
        )
    );

-- System can insert analytics
CREATE POLICY "System can insert bundle analytics" ON public.bundle_analytics
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 9. SMART_COLLECTIONS TABLE
-- ============================================
ALTER TABLE public.smart_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active collections" ON public.smart_collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON public.smart_collections;

-- Check for status columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'smart_collections' 
        AND column_name = 'is_active'
    ) THEN
        CREATE POLICY "Public can view active collections" ON public.smart_collections
            FOR SELECT
            USING (
                is_active = true
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    ELSE
        -- Default to public read
        CREATE POLICY "Public can view active collections" ON public.smart_collections
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Admins can manage collections
CREATE POLICY "Admins can manage collections" ON public.smart_collections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['products'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Public tables (read access for everyone)
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.inventory TO anon, authenticated;
GRANT SELECT ON public.bundles TO anon, authenticated;
GRANT SELECT ON public.smart_collections TO anon, authenticated;

-- Authenticated user tables
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;

-- Admin only tables
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT SELECT ON public.bundle_analytics TO authenticated;

-- Service role grants (for Edge Functions)
GRANT ALL ON public.inventory_movements TO service_role;
GRANT ALL ON public.bundle_analytics TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================
-- Show final RLS status
SELECT 
    'RLS Status After Migration:' as info,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'cart_items', 'orders', 'order_items', 'products', 
    'inventory', 'inventory_movements', 'user_profiles',
    'reviews', 'bundles', 'bundle_analytics', 'smart_collections'
)
ORDER BY tablename;