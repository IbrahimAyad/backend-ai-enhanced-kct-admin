-- Final RLS implementation for the last 3 unprotected tables
-- This handles: products, reviews, bundle_analytics

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow service role full access on products" ON public.products;
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

GRANT SELECT ON public.products TO authenticated, anon;
GRANT ALL ON public.products TO service_role; -- For Edge Functions

-- ============================================
-- 2. REVIEWS TABLE
-- ============================================
-- First check if reviews table has necessary columns
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Public can view approved reviews or their own reviews
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT
    USING (
        status = 'approved'
        OR user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'reviews' 
                AND column_name = 'customer_id'
            )
            AND customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid()
            OR (
                EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'reviews' 
                    AND column_name = 'customer_id'
                )
                AND customer_id IN (
                    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (
            EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'reviews' 
                AND column_name = 'customer_id'
            )
            AND customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
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

GRANT SELECT ON public.reviews TO authenticated, anon;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;

-- ============================================
-- 3. BUNDLE_ANALYTICS TABLE
-- ============================================
ALTER TABLE public.bundle_analytics ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view bundle analytics" ON public.bundle_analytics;
DROP POLICY IF EXISTS "System can insert bundle analytics" ON public.bundle_analytics;

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

-- System (Edge Functions) can insert analytics
CREATE POLICY "System can insert bundle analytics" ON public.bundle_analytics
    FOR INSERT
    WITH CHECK (true);

-- System can update analytics
CREATE POLICY "System can update bundle analytics" ON public.bundle_analytics
    FOR UPDATE
    USING (true);

GRANT SELECT ON public.bundle_analytics TO authenticated;
GRANT ALL ON public.bundle_analytics TO service_role; -- For Edge Functions

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 
    'FINAL RLS STATUS:' as info,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Protected'
        ELSE '❌ NOT Protected'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'reviews', 'bundle_analytics',
    'cart_items', 'orders', 'order_items', 
    'inventory', 'inventory_movements',
    'user_profiles', 'bundles', 'smart_collections',
    'customers', 'admin_users'
)
ORDER BY rls_status DESC, tablename;