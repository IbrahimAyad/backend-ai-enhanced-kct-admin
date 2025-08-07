-- ============================================
-- SIMPLE RLS FIX - NO SYNTAX ERRORS
-- ============================================

-- ============================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================

-- Drop and recreate functions
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.has_admin_permission(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = COALESCE(user_uuid, auth.uid())
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_name TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = COALESCE(user_uuid, auth.uid())
        AND is_active = true
        AND (permissions @> ARRAY[permission_name] OR permissions @> ARRAY['all'])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT, UUID) TO anon, authenticated;

-- ============================================
-- STEP 2: SIMPLE PRODUCTS POLICIES
-- ============================================

-- Remove all existing policies
DO $$
BEGIN
    -- Products
    DROP POLICY IF EXISTS "products_public_read" ON public.products;
    DROP POLICY IF EXISTS "products_admin_all" ON public.products;
    DROP POLICY IF EXISTS "products_admin_write" ON public.products;
    DROP POLICY IF EXISTS "products_admin_update" ON public.products;
    DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
    
    -- Product images
    DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;
    DROP POLICY IF EXISTS "product_images_admin_write" ON public.product_images;
    DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
    DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
    
    -- Product variants
    DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
    DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
    DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
    DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
    
    -- User profiles
    DROP POLICY IF EXISTS "user_profiles_public_read" ON public.user_profiles;
    DROP POLICY IF EXISTS "user_profiles_owner_update" ON public.user_profiles;
    DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
    DROP POLICY IF EXISTS "user_profiles_admin_delete" ON public.user_profiles;
END $$;

-- Create simple, working policies

-- PRODUCTS - Everyone can read
CREATE POLICY "allow_read_products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "allow_admin_modify_products" ON public.products
    FOR ALL USING (public.is_admin());

-- PRODUCT_IMAGES - Everyone can read
CREATE POLICY "allow_read_product_images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "allow_admin_modify_product_images" ON public.product_images
    FOR ALL USING (public.is_admin());

-- PRODUCT_VARIANTS - Everyone can read
CREATE POLICY "allow_read_product_variants" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "allow_admin_modify_product_variants" ON public.product_variants
    FOR ALL USING (public.is_admin());

-- USER_PROFILES - Everyone can read, users can modify their own
CREATE POLICY "allow_read_user_profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "allow_users_modify_own_profile" ON public.user_profiles
    FOR UPDATE USING (
        id = auth.uid() 
        OR user_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "allow_users_insert_profile" ON public.user_profiles
    FOR INSERT WITH CHECK (
        id = auth.uid() 
        OR user_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "allow_admin_delete_profiles" ON public.user_profiles
    FOR DELETE USING (public.is_admin());

-- ============================================
-- STEP 3: CHECK ADMIN USER
-- ============================================

-- Check if admin exists
SELECT 
    'Admin User Status' as check_type,
    COUNT(*) as admin_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Admin user exists'
        ELSE 'No admin user found - needs to be created'
    END as status
FROM public.admin_users
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@kctmenswear.com'
);

-- Show current policies
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'product_images', 'product_variants', 'user_profiles')
GROUP BY tablename
ORDER BY tablename;