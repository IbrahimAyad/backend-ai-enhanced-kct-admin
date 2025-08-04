-- Fresh RLS implementation after cleaning existing policies
-- Run this AFTER running 010_check_and_clean_existing_policies.sql

-- ============================================
-- PRODUCTS TABLE (Already has RLS enabled)
-- ============================================
-- Everyone can view active products, admins can manage
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

CREATE POLICY "Admins can manage products" ON public.products
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
-- PRODUCT_VARIANTS TABLE (Already has RLS)
-- ============================================
-- Similar pattern to products
CREATE POLICY "Public can view active variants" ON public.product_variants
    FOR SELECT
    USING (
        active = true
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage variants" ON public.product_variants
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
-- PRODUCT_IMAGES TABLE (Already has RLS)
-- ============================================
-- Same as products/variants
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT
    USING (true); -- All product images are public

CREATE POLICY "Admins can manage product images" ON public.product_images
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
-- ORDERS TABLE (Enable RLS if not already)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Users view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR guest_email IN (
            SELECT email FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- System creates orders
CREATE POLICY "System can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (true);

-- Admins update orders
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
-- ORDER_ITEMS TABLE
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'order_items'
    ) THEN
        -- Enable RLS if not already
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'order_items' 
            AND rowsecurity = true
        ) THEN
            ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Create policy
        CREATE POLICY "Users can view own order items" ON public.order_items
            FOR SELECT
            USING (
                order_id IN (
                    SELECT id FROM public.orders o
                    WHERE o.customer_id IN (
                        SELECT id FROM public.customers 
                        WHERE auth_user_id = auth.uid()
                    )
                    OR o.guest_email IN (
                        SELECT email FROM public.customers 
                        WHERE auth_user_id = auth.uid()
                    )
                )
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
    END IF;
END $$;

-- ============================================
-- CART_ITEMS TABLE
-- ============================================
DO $$
BEGIN
    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.cart_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
        CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
    END IF;
    
    -- Enable RLS if not already
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'cart_items' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL
    USING (
        user_id = auth.uid() 
        OR (user_id IS NULL AND session_id IS NOT NULL)
    );

-- ============================================
-- USER_PROFILES TABLE
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policy based on column structure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL
            USING (user_id = auth.uid());
    ELSE
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
            FOR ALL
            USING (id = auth.uid());
    END IF;
END $$;

-- ============================================
-- REMAINING TABLES - Quick implementation
-- ============================================

-- INVENTORY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'inventory' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

CREATE POLICY "Public can view inventory" ON public.inventory
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['inventory'] OR permissions @> ARRAY['all'])
        )
    );

-- REVIEWS (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'reviews'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'reviews' 
            AND rowsecurity = true
        ) THEN
            ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Add user_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.reviews ADD COLUMN user_id UUID REFERENCES auth.users(id);
        END IF;
        
        CREATE POLICY "Public can view approved reviews" ON public.reviews
            FOR SELECT
            USING (status = 'approved' OR user_id = auth.uid());
            
        CREATE POLICY "Users can manage own reviews" ON public.reviews
            FOR ALL
            USING (user_id = auth.uid());
    END IF;
END $$;

-- Final verification
SELECT 
    'FINAL RLS STATUS:' as info,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policies
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_variants', 'product_images',
    'orders', 'order_items', 'cart_items',
    'user_profiles', 'inventory', 'reviews'
)
ORDER BY tablename;