-- COMPREHENSIVE RLS POLICY FIX - FIXED SYNTAX
-- This migration fixes all RLS policy issues for the KCT Admin system

-- STEP 1: CLEAN SLATE - REMOVE ALL EXISTING POLICIES
-- Drop all existing policies on core tables
DO $migration$
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
END $migration$;

-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
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

-- STEP 3: HELPER FUNCTIONS FOR ADMIN CHECK
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $admin_check$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = user_uuid
        AND is_active = true
    );
END;
$admin_check$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $permission_check$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = user_uuid
        AND is_active = true
        AND (permissions @> ARRAY[permission_name] OR permissions @> ARRAY['all'])
    );
END;
$permission_check$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 4: PRODUCT TABLES POLICIES (PUBLIC READ, ADMIN WRITE)

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
    USING (true);

CREATE POLICY "product_images_admin_write" ON public.product_images
    FOR ALL
    USING (public.has_admin_permission('products'))
    WITH CHECK (public.has_admin_permission('products'));

-- PRODUCT_VARIANTS TABLE
CREATE POLICY "product_variants_public_read" ON public.product_variants
    FOR SELECT
    USING (
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

-- STEP 5: USER PROFILES POLICIES
CREATE POLICY "user_profiles_public_read" ON public.user_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "user_profiles_owner_write" ON public.user_profiles
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR id = auth.uid()
        ) OR public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR id = auth.uid()
        ) OR public.is_admin()
    );

-- STEP 6: CUSTOMER POLICIES
CREATE POLICY "customers_admin_full_access" ON public.customers
    FOR ALL
    USING (public.has_admin_permission('customers'))
    WITH CHECK (public.has_admin_permission('customers'));

CREATE POLICY "customers_owner_access" ON public.customers
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND (
            auth_user_id = auth.uid() OR user_id = auth.uid()
        )
    );

-- STEP 7: ADMIN USERS POLICIES
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

-- STEP 8: ORDER RELATED POLICIES
CREATE POLICY "orders_admin_full_access" ON public.orders
    FOR ALL
    USING (public.has_admin_permission('orders'))
    WITH CHECK (public.has_admin_permission('orders'));

CREATE POLICY "orders_customer_access" ON public.orders
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            customer_id IN (
                SELECT id FROM public.customers c
                WHERE c.auth_user_id = auth.uid() OR c.user_id = auth.uid()
            )
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
        ))
    );

CREATE POLICY "order_items_admin_write" ON public.order_items
    FOR ALL
    USING (public.has_admin_permission('orders'))
    WITH CHECK (public.has_admin_permission('orders'));

-- STEP 9: CART POLICIES
CREATE POLICY "cart_items_user_access" ON public.cart_items
    FOR ALL
    USING (
        public.is_admin()
        OR
        (auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR 
            customer_id IN (
                SELECT id FROM public.customers
                WHERE auth_user_id = auth.uid() OR user_id = auth.uid()
            )
        ))
    );

-- STEP 10: INVENTORY POLICIES
CREATE POLICY "inventory_public_read" ON public.inventory
    FOR SELECT
    USING (true);

CREATE POLICY "inventory_admin_write" ON public.inventory
    FOR ALL
    USING (public.has_admin_permission('inventory'))
    WITH CHECK (public.has_admin_permission('inventory'));

-- STEP 11: GRANT PROPER PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions for public/anon access
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

-- Grant admin permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT, UUID) TO authenticated, anon;

-- VERIFICATION QUERIES
SELECT 'Migration Complete' as status;