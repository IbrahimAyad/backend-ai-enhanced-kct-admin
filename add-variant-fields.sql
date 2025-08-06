-- Add missing fields to product_variants table
-- These fields are expected by the frontend

-- Add option1 field (for sizes)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option1 TEXT;

-- Add option2 field (for colors)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option2 TEXT;

-- Note: The product_variants table doesn't have size/color columns
-- Let's try to extract size information from variant names if available
UPDATE public.product_variants
SET option1 = CASE
    WHEN name ILIKE '%small%' THEN 'S'
    WHEN name ILIKE '%medium%' THEN 'M'
    WHEN name ILIKE '%large%' THEN 'L'
    WHEN name ILIKE '%x-large%' OR name ILIKE '%xlarge%' THEN 'XL'
    WHEN name ILIKE '%xx-large%' OR name ILIKE '%xxlarge%' OR name ILIKE '%2xl%' THEN 'XXL'
    WHEN name ~* '\b(S|M|L|XL|XXL|XS|XXXL)\b' THEN 
        substring(name from '\b(S|M|L|XL|XXL|XS|XXXL)\b')
    ELSE NULL
END
WHERE option1 IS NULL;

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
    is_nullable,
    is_generated
FROM 
    information_schema.columns
WHERE 
    table_name = 'product_variants'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Show sample variant data with new fields
SELECT 
    pv.name as variant_name,
    pv.sku,
    pv.option1 as size,
    pv.option2 as color,
    pv.inventory_quantity,
    pv.available,
    p.name as product_name
FROM 
    public.product_variants pv
JOIN 
    public.products p ON pv.product_id = p.id
LIMIT 10;