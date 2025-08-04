-- Update product_variants table and calculate price ranges
-- Run this in Supabase SQL Editor

-- 1. First, let's see what columns product_variants has
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- 2. Add stock_quantity column to product_variants if it doesn't exist
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0;

ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;

-- 3. Set some sample stock quantities for testing (random between 0-50)
UPDATE public.product_variants
SET stock_quantity = floor(random() * 50)::int,
    available_quantity = floor(random() * 50)::int;

-- 4. Calculate and update price_range for each product
UPDATE public.products p
SET price_range = (
    SELECT jsonb_build_object(
        'min', COALESCE(MIN(pv.price), p.base_price),
        'max', COALESCE(MAX(pv.price), p.base_price)
    )
    FROM public.product_variants pv
    WHERE pv.product_id = p.id
);

-- 5. Update total_inventory based on variant stock
UPDATE public.products p
SET total_inventory = COALESCE((
    SELECT SUM(pv.stock_quantity)
    FROM public.product_variants pv
    WHERE pv.product_id = p.id
), 0);

-- 6. Update in_stock based on inventory
UPDATE public.products p
SET in_stock = (total_inventory > 0);

-- 7. Show updated product data
SELECT 
    id,
    name,
    sku,
    base_price,
    total_inventory,
    variant_count,
    in_stock,
    price_range
FROM products
LIMIT 10;

-- 8. Show some variant data
SELECT 
    pv.id,
    pv.sku,
    pv.price,
    pv.stock_quantity,
    pv.available_quantity,
    p.name as product_name
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
LIMIT 10;