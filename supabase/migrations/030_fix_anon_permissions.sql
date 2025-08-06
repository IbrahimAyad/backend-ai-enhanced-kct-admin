-- Fix permissions for anon role to access product-related tables
-- This allows the main KCT site to fetch products using the anon key

-- Grant SELECT permissions to anon role
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_variants TO anon;

-- Also ensure these tables exist in the grants
GRANT USAGE ON SCHEMA public TO anon;

-- Verify the policies are working
DO $$
BEGIN
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('products', 'product_images', 'product_variants')
        AND rowsecurity = false
    ) THEN
        RAISE NOTICE 'Warning: RLS is not enabled on some product tables';
    END IF;
END $$;

-- Add a comment for documentation
COMMENT ON TABLE public.products IS 'Products table with public read access via RLS and anon role';
COMMENT ON TABLE public.product_images IS 'Product images with public read access via RLS and anon role';
COMMENT ON TABLE public.product_variants IS 'Product variants with public read access via RLS and anon role';