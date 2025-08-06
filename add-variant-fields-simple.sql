-- Simple migration: Add missing fields to product_variants table
-- These fields are expected by the frontend

-- Add option1 field (for sizes)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option1 TEXT;

-- Add option2 field (for colors)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option2 TEXT;

-- Add available boolean field (computed based on inventory)
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS available BOOLEAN GENERATED ALWAYS AS (
    COALESCE(inventory_quantity, 0) > 0
) STORED;

-- Create index for better performance on product detail queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON public.product_variants(product_id);

-- Create index for slug-based lookups
CREATE INDEX IF NOT EXISTS idx_products_slug 
ON public.products(slug);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'product_variants'
    AND table_schema = 'public'
    AND column_name IN ('option1', 'option2', 'available')
ORDER BY 
    column_name;

-- Show count of variants that will have the new fields
SELECT 
    COUNT(*) as total_variants,
    COUNT(CASE WHEN COALESCE(inventory_quantity, 0) > 0 THEN 1 END) as available_variants
FROM 
    public.product_variants;