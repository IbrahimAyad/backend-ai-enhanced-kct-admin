-- STEP 1: Check what columns actually exist in product_variants
SELECT 
    'Current product_variants columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- STEP 2: Add only the columns we need that don't exist
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS size_display VARCHAR(20);

-- STEP 3: Install the size templates first
INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) 
VALUES
('suits', 'Standard Suit Sizes', '{"short": ["36S", "38S", "40S", "42S", "44S", "46S", "48S"], "regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"], "long": ["38L", "40L", "42L", "44L", "46L", "48L", "50L", "52L", "54L"], "popular_sizes": ["40R", "42R", "44R"]}', 'grid', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) 
VALUES
('blazers', 'Standard Blazer Sizes', '{"regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"], "popular_sizes": ["40R", "42R", "44R"]}', 'grid', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) 
VALUES
('sweaters', 'Standard Sweater Sizes', '{"sizes": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"], "popular_sizes": ["M", "L", "XL"]}', 'dropdown', true)
ON CONFLICT DO NOTHING;

-- STEP 4: Generate variants using ONLY existing columns (basic approach)
-- For SUITS - using only the core columns that should exist
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R']) as size
) sizes
WHERE (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- For BLAZERS
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R']) as size
) sizes
WHERE (p.name ILIKE '%blazer%' OR p.category ILIKE '%blazer%')
AND NOT (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- For ALL OTHER PRODUCTS (default sizes)
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['S', 'M', 'L', 'XL']) as size
) sizes
WHERE NOT (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%')
AND NOT (p.name ILIKE '%blazer%' OR p.category ILIKE '%blazer%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- STEP 5: Update size_display if the column exists
UPDATE public.product_variants 
SET size_display = option1 
WHERE size_display IS NULL;

-- STEP 6: Update total_inventory for products
UPDATE public.products 
SET total_inventory = (
    SELECT COALESCE(SUM(pv.stock_quantity), 0)
    FROM public.product_variants pv
    WHERE pv.product_id = products.id
);

-- VERIFICATION: Show results
SELECT 
    'Size Templates Created' as check_type,
    COUNT(*) as template_count
FROM public.size_templates;

SELECT 
    'Variants Summary' as info,
    p.name,
    COUNT(pv.id) as variant_count,
    STRING_AGG(DISTINCT pv.option1, ', ' ORDER BY pv.option1) as sizes
FROM public.products p
LEFT JOIN public.product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NOT NULL
GROUP BY p.id, p.name
ORDER BY COUNT(pv.id) DESC
LIMIT 10;

SELECT 
    'Final Summary' as info,
    COUNT(DISTINCT p.id) as products_with_variants,
    COUNT(pv.id) as total_variants_created
FROM public.products p
JOIN public.product_variants pv ON p.id = pv.product_id;