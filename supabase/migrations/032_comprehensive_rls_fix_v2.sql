-- ============================================
-- COMPREHENSIVE RLS POLICY FIX V2
-- ============================================
-- Fixed version that handles user_profiles table correctly
-- Created: 2025-08-07

-- ============================================
-- STEP 1: CLEAN SLATE - REMOVE ALL EXISTING POLICIES
-- ============================================

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

-- Enable RLS on core tables that definitely exist
DO $$
BEGIN
    -- Products and related
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_images') THEN
        ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variants') THEN
        ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- User related
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Orders and related
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
        ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Inventory
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
        ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- STEP 3: HELPER FUNCTIONS FOR ADMIN CHECK
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
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
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = user_uuid
        AND is_active = true
        AND (permissions @> ARRAY[permission_name] OR permissions @> ARRAY['all'])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 4: PRODUCTS AND RELATED TABLES
-- ============================================

-- PRODUCTS: Public read for active, admin full access
CREATE POLICY "products_public_read" ON public.products
    FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "products_admin_all" ON public.products
    FOR ALL
    USING (public.has_admin_permission('products'));

-- PRODUCT_IMAGES: Public read, admin write
CREATE POLICY "product_images_public_read" ON public.product_images
    FOR SELECT
    USING (true);

CREATE POLICY "product_images_admin_write" ON public.product_images
    FOR INSERT
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_images_admin_update" ON public.product_images
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_images_admin_delete" ON public.product_images
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- PRODUCT_VARIANTS: Public read for active, admin write
CREATE POLICY "product_variants_public_read" ON public.product_variants
    FOR SELECT
    USING (
        status = 'active' 
        OR public.is_admin()
    );

CREATE POLICY "product_variants_admin_write" ON public.product_variants
    FOR INSERT
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_variants_admin_update" ON public.product_variants
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_variants_admin_delete" ON public.product_variants
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- ============================================
-- STEP 5: USER PROFILES (Fixed for proper column)
-- ============================================

-- First, check what column structure user_profiles has
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_id BOOLEAN;
BEGIN
    -- Check if user_profiles exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        -- Check column structure
        SELECT 
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id'),
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'id')
        INTO has_user_id, has_id;
        
        -- Create appropriate policies based on column structure
        IF has_id AND NOT has_user_id THEN
            -- Table uses 'id' as primary key (references auth.users.id)
            CREATE POLICY "user_profiles_public_read" ON public.user_profiles
                FOR SELECT
                USING (true);
            
            CREATE POLICY "user_profiles_owner_update" ON public.user_profiles
                FOR UPDATE
                USING (id = auth.uid() OR public.is_admin());
            
            CREATE POLICY "user_profiles_insert" ON public.user_profiles
                FOR INSERT
                WITH CHECK (id = auth.uid() OR public.is_admin());
            
        ELSIF has_user_id THEN
            -- Table has 'user_id' column
            CREATE POLICY "user_profiles_public_read" ON public.user_profiles
                FOR SELECT
                USING (true);
            
            CREATE POLICY "user_profiles_owner_update" ON public.user_profiles
                FOR UPDATE
                USING (user_id = auth.uid() OR public.is_admin());
            
            CREATE POLICY "user_profiles_insert" ON public.user_profiles
                FOR INSERT
                WITH CHECK (user_id = auth.uid() OR public.is_admin());
        END IF;
        
        -- Admin delete policy (works regardless of column structure)
        CREATE POLICY "user_profiles_admin_delete" ON public.user_profiles
            FOR DELETE
            USING (public.is_admin());
    END IF;
END $$;

-- ============================================
-- STEP 6: CUSTOMERS TABLE
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        -- Check if auth_user_id column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'auth_user_id') THEN
            CREATE POLICY "customers_own_read" ON public.customers
                FOR SELECT
                USING (auth_user_id = auth.uid() OR public.is_admin());
            
            CREATE POLICY "customers_own_update" ON public.customers
                FOR UPDATE
                USING (auth_user_id = auth.uid() OR public.is_admin());
            
            CREATE POLICY "customers_insert" ON public.customers
                FOR INSERT
                WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL OR public.is_admin());
        ELSE
            -- Fallback if no auth_user_id column
            CREATE POLICY "customers_public_read" ON public.customers
                FOR SELECT
                USING (public.is_admin());
            
            CREATE POLICY "customers_admin_all" ON public.customers
                FOR ALL
                USING (public.is_admin());
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 7: ADMIN USERS TABLE
-- ============================================

CREATE POLICY "admin_users_self_read" ON public.admin_users
    FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

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
-- STEP 8: ORDERS AND CART
-- ============================================

-- ORDERS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        CREATE POLICY "orders_customer_read" ON public.orders
            FOR SELECT
            USING (
                customer_id IN (
                    SELECT id FROM public.customers 
                    WHERE auth_user_id = auth.uid()
                )
                OR public.is_admin()
            );
        
        CREATE POLICY "orders_system_insert" ON public.orders
            FOR INSERT
            WITH CHECK (true);
        
        CREATE POLICY "orders_admin_update" ON public.orders
            FOR UPDATE
            USING (public.has_admin_permission('orders'));
    END IF;
END $$;

-- CART_ITEMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
        -- Check what columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'user_id') THEN
            CREATE POLICY "cart_items_user_all" ON public.cart_items
                FOR ALL
                USING (
                    user_id = auth.uid() 
                    OR (user_id IS NULL AND session_id IS NOT NULL)
                    OR public.is_admin()
                );
        ELSE
            -- Fallback for session-based carts
            CREATE POLICY "cart_items_all" ON public.cart_items
                FOR ALL
                USING (true);
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 9: INVENTORY
-- ============================================

CREATE POLICY "inventory_public_read" ON public.inventory
    FOR SELECT
    USING (true);

CREATE POLICY "inventory_admin_write" ON public.inventory
    FOR INSERT
    USING (public.has_admin_permission('inventory'));

CREATE POLICY "inventory_admin_update" ON public.inventory
    FOR UPDATE
    USING (public.has_admin_permission('inventory'));

CREATE POLICY "inventory_admin_delete" ON public.inventory
    FOR DELETE
    USING (public.has_admin_permission('inventory'));

-- ============================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Products and related (public read)
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.inventory TO anon, authenticated;

-- User data (authenticated only)
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Admin tables (authenticated only, policies handle actual access)
GRANT SELECT ON public.admin_users TO authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT, UUID) TO anon, authenticated;

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been successfully configured!';
    RAISE NOTICE 'Run the verification script to test your setup.';
END $$;