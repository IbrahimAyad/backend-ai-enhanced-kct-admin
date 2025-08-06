-- Add missing fields to product_variants table
-- These fields are expected by the frontend

-- Add option1 field (for sizes)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option1 TEXT;

-- Add option2 field (for colors)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option2 TEXT;

-- Migrate existing size/color data to option fields
UPDATE public.product_variants
SET 
    option1 = size,
    option2 = color
WHERE option1 IS NULL OR option2 IS NULL;

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
ORDER BY 
    ordinal_position;