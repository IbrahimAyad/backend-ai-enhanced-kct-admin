-- STEP 1: Add missing columns to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS size_display VARCHAR(20);

-- Note: option1 and option2 should already exist from our previous migration
-- But let's make sure they exist
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option1 TEXT;

ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS option2 TEXT;

-- STEP 2: Install the size templates
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
('dress_shirts', 'Dress Shirt Sizing', '{"neck_sizes": ["15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5", "19", "19.5", "20", "22"], "sleeve_lengths": ["32-33", "34-35", "36-37"], "fit_types": ["slim_cut", "classic_fit"]}', 'two_step', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) 
VALUES
('sweaters', 'Standard Sweater Sizes', '{"sizes": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"], "popular_sizes": ["M", "L", "XL"]}', 'dropdown', true)
ON CONFLICT DO NOTHING;

-- STEP 3: Generate variants for SUITS (using existing columns only)
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price, status)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price,
    'active' as status
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['36S', '38S', '40S', '42S', '44S', '46S', '48S', 
                        '36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R',
                        '38L', '40L', '42L', '44L', '46L', '48L', '50L', '52L', '54L']) as size
) sizes
WHERE (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- STEP 4: Generate variants for BLAZERS
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price, status)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price,
    'active' as status
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R']) as size
) sizes
WHERE (p.name ILIKE '%blazer%' OR p.category ILIKE '%blazer%')
AND NOT (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%') -- Exclude suits
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- STEP 5: Generate variants for DRESS SHIRTS (basic sizes for now)
INSERT INTO public.product_variants (product_id, sku, option1, option2, inventory_quantity, stock_quantity, price, status)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    'classic_fit' as option2,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price,
    'active' as status
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['15/32-33', '15.5/32-33', '16/34-35', '16.5/34-35', '17/34-35', '17.5/36-37']) as size
) sizes
WHERE (p.name ILIKE '%shirt%' OR p.category ILIKE '%shirt%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- STEP 6: Generate variants for OTHER PRODUCTS (S-XL)
INSERT INTO public.product_variants (product_id, sku, option1, inventory_quantity, stock_quantity, price, status)
SELECT 
    p.id as product_id,
    substring(p.id::text, 1, 8) || '-' || sizes.size as sku,
    sizes.size as option1,
    10 as inventory_quantity,
    10 as stock_quantity,
    p.base_price as price,
    'active' as status
FROM public.products p
CROSS JOIN (
    SELECT unnest(ARRAY['S', 'M', 'L', 'XL', '2XL']) as size
) sizes
WHERE NOT (p.name ILIKE '%suit%' OR p.category ILIKE '%suit%')
AND NOT (p.name ILIKE '%blazer%' OR p.category ILIKE '%blazer%')
AND NOT (p.name ILIKE '%shirt%' OR p.category ILIKE '%shirt%')
AND NOT EXISTS (
    SELECT 1 FROM public.product_variants pv 
    WHERE pv.product_id = p.id AND pv.option1 = sizes.size
);

-- STEP 7: Now update the size_display column for all variants
UPDATE public.product_variants 
SET size_display = option1 
WHERE size_display IS NULL;

-- STEP 8: Update total_inventory for all products
UPDATE public.products 
SET total_inventory = (
    SELECT COALESCE(SUM(pv.stock_quantity), 0)
    FROM public.product_variants pv
    WHERE pv.product_id = products.id
);

-- VERIFICATION: Show what was created
SELECT 
    'Variants Created Summary' as info,
    p.name,
    COUNT(pv.id) as variant_count,
    STRING_AGG(DISTINCT pv.option1, ', ' ORDER BY pv.option1) as sizes_created
FROM public.products p
LEFT JOIN public.product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NOT NULL
GROUP BY p.id, p.name
ORDER BY COUNT(pv.id) DESC
LIMIT 15;

-- Final count
SELECT 
    'Final Summary' as info,
    COUNT(DISTINCT p.id) as products_with_variants,
    COUNT(pv.id) as total_variants_created,
    AVG(COUNT(pv.id)) OVER () as avg_variants_per_product
FROM public.products p
JOIN public.product_variants pv ON p.id = pv.product_id
GROUP BY p.id;