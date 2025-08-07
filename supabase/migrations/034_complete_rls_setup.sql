-- ============================================
-- COMPLETE RLS SETUP WITH FUNCTIONS
-- ============================================
-- This creates all necessary functions and policies

-- ============================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.has_admin_permission(TEXT, UUID);

-- Create is_admin function
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

-- Create has_admin_permission function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(TEXT, UUID) TO anon, authenticated;

-- ============================================
-- STEP 2: FIX USER_PROFILES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_profiles_public_read" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_delete" ON public.user_profiles;

-- Create new policies
CREATE POLICY "user_profiles_public_read" ON public.user_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "user_profiles_owner_update" ON public.user_profiles
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        OR id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "user_profiles_admin_delete" ON public.user_profiles
    FOR DELETE
    USING (public.is_admin());

-- ============================================
-- STEP 3: ENSURE PRODUCTS POLICIES EXIST
-- ============================================

-- Drop and recreate products policies
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;

CREATE POLICY "products_public_read" ON public.products
    FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "products_admin_write" ON public.products
    FOR INSERT
    WITH CHECK (public.has_admin_permission('products'));

CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- ============================================
-- STEP 4: PRODUCT IMAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_write" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;

CREATE POLICY "product_images_public_read" ON public.product_images
    FOR SELECT
    USING (true);

CREATE POLICY "product_images_admin_write" ON public.product_images
    FOR INSERT
    WITH CHECK (public.has_admin_permission('products'));

CREATE POLICY "product_images_admin_update" ON public.product_images
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_images_admin_delete" ON public.product_images
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- ============================================
-- STEP 5: PRODUCT VARIANTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;

CREATE POLICY "product_variants_public_read" ON public.product_variants
    FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "product_variants_admin_write" ON public.product_variants
    FOR INSERT
    WITH CHECK (public.has_admin_permission('products'));

CREATE POLICY "product_variants_admin_update" ON public.product_variants
    FOR UPDATE
    USING (public.has_admin_permission('products'));

CREATE POLICY "product_variants_admin_delete" ON public.product_variants
    FOR DELETE
    USING (public.has_admin_permission('products'));

-- ============================================
-- STEP 6: VERIFY ADMIN USER EXISTS
-- ============================================

DO $$
DECLARE
    admin_count INTEGER;
    admin_email TEXT := 'admin@kctmenswear.com';
    admin_id UUID;
BEGIN
    -- Check if admin user exists
    SELECT COUNT(*), MAX(user_id) 
    INTO admin_count, admin_id
    FROM public.admin_users
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email = admin_email
    );
    
    IF admin_count > 0 THEN
        RAISE NOTICE 'Admin user found: %', admin_id;
        
        -- Ensure admin is active with all permissions
        UPDATE public.admin_users
        SET 
            is_active = true,
            permissions = ARRAY['all'],
            role = 'super_admin'
        WHERE user_id = admin_id;
        
        RAISE NOTICE 'Admin user updated with full permissions';
    ELSE
        RAISE NOTICE 'No admin user found for email: %', admin_email;
        RAISE NOTICE 'You may need to create an admin_users record for this user';
    END IF;
END $$;

-- ============================================
-- STEP 7: TEST FUNCTIONS
-- ============================================

DO $$
BEGIN
    -- Test that functions work
    PERFORM public.is_admin();
    RAISE NOTICE '✅ is_admin() function works';
    
    PERFORM public.has_admin_permission('products');
    RAISE NOTICE '✅ has_admin_permission() function works';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '❌ Function test failed: %', SQLERRM;
END $$;

-- ============================================
-- STEP 8: SHOW CURRENT STATE
-- ============================================

-- Show policies on key tables
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'product_images', 'product_variants', 'user_profiles')
GROUP BY tablename
ORDER BY tablename;

-- Show if admin user exists
SELECT 
    'Admin users in system' as info,
    COUNT(*) as total_admins,
    COUNT(*) FILTER (WHERE is_active = true) as active_admins
FROM public.admin_users;

RAISE NOTICE 'Setup complete! If you still have issues, check that your admin@kctmenswear.com user has a record in the admin_users table';