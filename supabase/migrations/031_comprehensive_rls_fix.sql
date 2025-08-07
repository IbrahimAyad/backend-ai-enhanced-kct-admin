-- ============================================
-- COMPREHENSIVE RLS POLICY FIX
-- ============================================
-- This migration fixes all RLS policy issues for the KCT Admin system
-- Addresses 406 (Not Acceptable) and 403 (Forbidden) errors
-- Created: 2025-08-07

-- ============================================
-- STEP 1: CLEAN SLATE - REMOVE ALL EXISTING POLICIES
-- ============================================
-- This prevents conflicts and ensures a clean policy setup

DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all existing policies on core tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (
            'products', 'product_images', 'product_variants',
            'user_profiles', 'customers', 'admin_users',
            'orders', 'order_items', 'cart_items',
            'inventory', 'inventory_movements',
            'reviews', 'bundles', 'bundle_analytics'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- ============================================
-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Enable RLS on optional tables if they exist
DO $$
BEGIN
    -- Check and enable RLS on additional tables if they exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
        ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bundles') THEN
        ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bundle_analytics') THEN
        ALTER TABLE public.bundle_analytics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- STEP 3: HELPER FUNCTION FOR ADMIN CHECK
-- ============================================
-- Create a function to check if user is admin (reduces policy complexity)

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = user_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = user_uuid
        AND is_active = true
        AND (permissions @> ARRAY[permission_name] OR permissions @> ARRAY['all'])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 4: PRODUCT TABLES POLICIES (PUBLIC READ, ADMIN WRITE)
-- ============================================

-- PRODUCTS TABLE
CREATE POLICY "products_public_read" ON public.products
    FOR SELECT
    USING (
        status = 'active' 
        OR public.is_admin()
    );

CREATE POLICY "products_admin_insert" ON public.products
    FOR INSERT
    WITH CHECK (public.has_admin_permission('products'));

CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- PRODUCT_IMAGES TABLE
CREATE POLICY "product_images_public_read" ON public.product_images
    FOR SELECT
    USING (true); -- All product images are public

CREATE POLICY "product_images_admin_write" ON public.product_images
    FOR ALL
    USING (public.has_admin_permission('products'))
    WITH CHECK (public.has_admin_permission('products'));

-- PRODUCT_VARIANTS TABLE
CREATE POLICY "product_variants_public_read" ON public.product_variants
    FOR SELECT
    USING (
        -- Allow if product is active or user is admin
        EXISTS (
            SELECT 1 FROM public.products p 
            WHERE p.id = product_variants.product_id 
            AND (p.status = 'active' OR public.is_admin())
        )
    );

CREATE POLICY "product_variants_admin_write" ON public.product_variants
    FOR ALL
    USING (public.has_admin_permission('products'))
    WITH CHECK (public.has_admin_permission('products'));

-- ============================================
-- STEP 5: USER PROFILES POLICIES (FIX 406 ERRORS)
-- ============================================
-- Simple, non-conflicting policies for user_profiles

CREATE POLICY "user_profiles_public_read" ON public.user_profiles
    FOR SELECT
    USING (true); -- Allow public read (adjust if needed for privacy)

CREATE POLICY "user_profiles_owner_write" ON public.user_profiles
    FOR ALL
    USING (
        -- Check if user owns the profile or is admin
        (auth.uid() IS NOT NULL AND (
            -- Check if user_id column exists and matches
            (CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'user_profiles' 
                AND column_name = 'user_id'
            ) THEN user_id = auth.uid()
            -- Fallback to id column if user_id doesn't exist
            ELSE id = auth.uid()
            END)
        )) OR public.is_admin()
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (
            (CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'user_profiles' 
                AND column_name = 'user_id'
            ) THEN user_id = auth.uid()
            ELSE id = auth.uid()
            END)
        )) OR public.is_admin()
    );

-- ============================================
-- STEP 6: CUSTOMER POLICIES
-- ============================================

CREATE POLICY "customers_admin_full_access" ON public.customers
    FOR ALL
    USING (public.has_admin_permission('customers'))
    WITH CHECK (public.has_admin_permission('customers'));

CREATE POLICY "customers_owner_access" ON public.customers
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND (
            -- Check auth_user_id if it exists
            CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'customers' 
                AND column_name = 'auth_user_id'
            ) THEN auth_user_id = auth.uid()
            -- Fallback to user_id if it exists
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'customers' 
                AND column_name = 'user_id'
            ) THEN user_id = auth.uid()
            ELSE false
            END
        )
    );

-- ============================================
-- STEP 7: ADMIN USERS POLICIES (SELF-REFERENTIAL)
-- ============================================

CREATE POLICY "admin_users_self_read" ON public.admin_users
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "admin_users_super_admin_manage" ON public.admin_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super_admin'
        )
    );

-- ============================================
-- STEP 8: ORDER RELATED POLICIES
-- ============================================

-- ORDERS TABLE
CREATE POLICY "orders_admin_full_access" ON public.orders
    FOR ALL
    USING (public.has_admin_permission('orders'))
    WITH CHECK (public.has_admin_permission('orders'));

CREATE POLICY "orders_customer_access" ON public.orders
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Check if customer_id links to authenticated user
            customer_id IN (
                SELECT id FROM public.customers c 
                WHERE c.auth_user_id = auth.uid() OR c.user_id = auth.uid()
            )
            OR
            -- Check guest_email if it exists and matches user email
            (guest_email IS NOT NULL AND guest_email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            ))
        )
    );

-- ORDER_ITEMS TABLE
CREATE POLICY "order_items_access_via_order" ON public.order_items
    FOR SELECT
    USING (
        public.has_admin_permission('orders')
        OR
        (auth.uid() IS NOT NULL AND order_id IN (
            SELECT id FROM public.orders o
            WHERE o.customer_id IN (
                SELECT id FROM public.customers c 
                WHERE c.auth_user_id = auth.uid() OR c.user_id = auth.uid()
            )
            OR (o.guest_email IS NOT NULL AND o.guest_email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            ))
        ))
    );

CREATE POLICY "order_items_admin_write" ON public.order_items
    FOR ALL
    USING (public.has_admin_permission('orders'))
    WITH CHECK (public.has_admin_permission('orders'));

-- ============================================
-- STEP 9: CART POLICIES
-- ============================================

CREATE POLICY "cart_items_user_access" ON public.cart_items
    FOR ALL
    USING (
        public.is_admin()
        OR
        (auth.uid() IS NOT NULL AND (
            -- Check user_id if it exists
            CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'cart_items' 
                AND column_name = 'user_id'
            ) THEN user_id = auth.uid()
            -- Check customer_id linking to auth user
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'cart_items' 
                AND column_name = 'customer_id'
            ) THEN customer_id IN (
                SELECT id FROM public.customers 
                WHERE auth_user_id = auth.uid() OR user_id = auth.uid()
            )
            ELSE false
            END
        ))
    );

-- ============================================
-- STEP 10: INVENTORY POLICIES
-- ============================================

CREATE POLICY "inventory_public_read" ON public.inventory
    FOR SELECT
    USING (true); -- Public can read inventory levels

CREATE POLICY "inventory_admin_write" ON public.inventory
    FOR ALL
    USING (public.has_admin_permission('inventory'))
    WITH CHECK (public.has_admin_permission('inventory'));

-- ============================================
-- STEP 11: OPTIONAL TABLES POLICIES
-- ============================================

-- INVENTORY_MOVEMENTS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
        EXECUTE 'CREATE POLICY "inventory_movements_admin_only" ON public.inventory_movements
            FOR ALL
            USING (public.has_admin_permission(''inventory''))
            WITH CHECK (public.has_admin_permission(''inventory''))';
    END IF;
END $$;

-- REVIEWS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        -- Public can read approved reviews
        EXECUTE 'CREATE POLICY "reviews_public_read" ON public.reviews
            FOR SELECT
            USING (status = ''approved'' OR public.is_admin())';
        
        -- Users can create and edit their own reviews
        EXECUTE 'CREATE POLICY "reviews_user_write" ON public.reviews
            FOR ALL
            USING (auth.uid() = user_id OR public.is_admin())
            WITH CHECK (auth.uid() = user_id OR public.is_admin())';
    END IF;
END $$;

-- BUNDLES (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bundles') THEN
        EXECUTE 'CREATE POLICY "bundles_public_read" ON public.bundles
            FOR SELECT
            USING (is_active = true OR public.is_admin())';
        
        EXECUTE 'CREATE POLICY "bundles_admin_write" ON public.bundles
            FOR ALL
            USING (public.has_admin_permission(''products''))
            WITH CHECK (public.has_admin_permission(''products''))';
    END IF;
END $$;

-- BUNDLE_ANALYTICS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bundle_analytics') THEN
        EXECUTE 'CREATE POLICY "bundle_analytics_admin_only" ON public.bundle_analytics
            FOR ALL
            USING (public.has_admin_permission(''analytics''))
            WITH CHECK (public.has_admin_permission(''analytics''))';
    END IF;
END $$;

-- ============================================
-- STEP 12: GRANT PROPER PERMISSIONS
-- ============================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions for public/anon access (main site)
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.inventory TO anon, authenticated;

-- Grant authenticated user permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Grant admin permissions (broader access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT, UUID) TO authenticated, anon;

-- ============================================
-- STEP 13: VERIFICATION QUERIES
-- ============================================

-- Check RLS status
SELECT 
    'RLS Status Check' as verification_type,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory'
)
ORDER BY tablename;

-- Check policies created
SELECT 
    'Policy Check' as verification_type,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ PERMISSIVE'
        ELSE '⚠️  RESTRICTIVE'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory'
)
ORDER BY tablename, cmd, policyname;

-- Check admin function works
SELECT 
    'Admin Function Test' as verification_type,
    CASE 
        WHEN public.is_admin() IS NOT NULL THEN '✅ Function works'
        ELSE '❌ Function failed'
    END as function_status;

-- Final summary
SELECT 
    'Migration Summary' as info,
    COUNT(*) as total_policies_created
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'product_images', 'product_variants',
    'user_profiles', 'customers', 'admin_users',
    'orders', 'order_items', 'cart_items', 'inventory'
);

-- ============================================
-- IMPORTANT NOTES
-- ============================================

/*
ERROR EXPLANATIONS:

1. 406 "Not Acceptable" errors occur when:
   - Multiple conflicting RLS policies exist
   - Policy conditions are too complex or circular
   - Malformed policy syntax
   - SOLUTION: This migration drops all existing policies and creates clean, simple ones

2. 403 "Forbidden" errors occur when:
   - No policies allow access for the current role
   - Missing GRANT statements for basic table access
   - Authentication context doesn't match policy requirements
   - SOLUTION: This migration includes proper GRANTs and comprehensive policies

POLICY DESIGN PRINCIPLES:
- Simple, non-overlapping policies
- Clear separation between admin and user access
- Helper functions to reduce policy complexity
- Proper GRANTs for both authenticated and anon roles
- Public read access for product data (e-commerce requirement)
- Secure admin-only access for sensitive operations

TESTING RECOMMENDATIONS:
1. Test with anon key (main site access)
2. Test with authenticated users
3. Test with admin users
4. Check both read and write operations
5. Verify error logs for any remaining issues

If you still get errors after running this migration:
1. Check the Supabase logs for specific error details
2. Verify your JWT tokens are valid
3. Ensure admin_users table has correct data
4. Test individual policies with EXPLAIN queries
*/