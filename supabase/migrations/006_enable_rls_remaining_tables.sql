-- Enable RLS on remaining critical tables
-- This migration adds RLS to tables that currently don't have it enabled

-- ============================================
-- 1. ORDERS TABLE
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (
        -- Match by customer_id linked to auth user
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR
        -- Allow admins to see all
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Only service role (Edge Functions) can create orders
CREATE POLICY "Service role can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (
        -- Check if the customer_id belongs to current user or is admin
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['orders'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 2. ORDER_ITEMS TABLE
-- ============================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- Users can view items from their orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT
    USING (
        order_id IN (
            SELECT o.id FROM public.orders o
            JOIN public.customers c ON o.customer_id = c.id
            WHERE c.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ============================================
-- 3. CART_ITEMS TABLE
-- ============================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- First, check if user_id column exists, if not add it
DO $$
BEGIN
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

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

-- Comprehensive cart management policy
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL
    USING (
        user_id = auth.uid() 
        OR (user_id IS NULL AND session_id IS NOT NULL) -- Guest cart
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- ============================================
-- 4. USER_PROFILES TABLE
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Check if this table uses 'id' or 'user_id' as the auth reference
DO $$
DECLARE
    auth_column text;
BEGIN
    -- Check which column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'id'
        AND data_type = 'uuid'
    ) THEN
        auth_column := 'id';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
    ) THEN
        auth_column := 'user_id';
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;

-- Users can only manage their own profile
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL
    USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'user_profiles' 
                AND column_name = 'id'
                AND data_type = 'uuid'
            ) THEN id = auth.uid()
            ELSE user_id = auth.uid()
        END
    );

-- ============================================
-- 5. PRODUCTS TABLE (Public read, admin write)
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
-- 6. INVENTORY TABLE
-- ============================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;

-- Public can view inventory levels
CREATE POLICY "Public can view inventory" ON public.inventory
    FOR SELECT
    USING (true); -- Everyone can check stock levels

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
-- 7. INVENTORY_MOVEMENTS TABLE
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

-- System can create movements (via triggers/functions)
CREATE POLICY "System can create movements" ON public.inventory_movements
    FOR INSERT
    WITH CHECK (true); -- Allow system operations

-- ============================================
-- 8. REVIEWS TABLE
-- ============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Check if reviews table has user/customer reference
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

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT
    USING (
        status = 'approved'
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
-- 9. BUNDLES TABLE
-- ============================================
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active bundles" ON public.bundles;
DROP POLICY IF EXISTS "Admins can manage bundles" ON public.bundles;

-- Public can view active bundles
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
-- 10. SMART_COLLECTIONS TABLE
-- ============================================
ALTER TABLE public.smart_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active collections" ON public.smart_collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON public.smart_collections;

-- Public can view active collections
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
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.products TO authenticated, anon;
GRANT SELECT ON public.inventory TO authenticated, anon;
GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.bundles TO authenticated, anon;
GRANT SELECT ON public.smart_collections TO authenticated, anon;

-- Summary: This migration enables RLS on all critical tables that were missing it