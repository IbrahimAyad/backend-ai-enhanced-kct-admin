-- EMERGENCY ROLLBACK PLAN
-- If the RLS migration causes issues, run this to restore basic access

-- IMMEDIATE ACCESS RESTORATION (if needed)
-- This disables RLS temporarily to restore access
DO $$
BEGIN
    -- Disable RLS on core tables (EMERGENCY ONLY)
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS temporarily disabled for emergency access';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error disabling RLS: %', SQLERRM;
END $$;

-- SIMPLE FALLBACK POLICIES (if you need basic functionality)
-- Re-enable RLS with minimal policies
DO $$
BEGIN
    -- Re-enable RLS
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
    
    -- Create simple public read policies
    CREATE POLICY "emergency_products_read" ON public.products FOR SELECT USING (true);
    CREATE POLICY "emergency_images_read" ON public.product_images FOR SELECT USING (true);
    CREATE POLICY "emergency_variants_read" ON public.product_variants FOR SELECT USING (true);
    
    RAISE NOTICE 'Emergency policies created';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating emergency policies: %', SQLERRM;
END $$;