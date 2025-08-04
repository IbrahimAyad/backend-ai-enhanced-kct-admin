-- Simple script to add missing columns to products table
-- Run this in Supabase SQL Editor

-- Add missing columns to products table one by one
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_range JSONB;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS total_inventory INTEGER DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS primary_image TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variant_count INTEGER DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_gallery TEXT[] DEFAULT '{}';

-- Check what columns we have now
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Update variant count for existing products
UPDATE public.products p
SET variant_count = (
    SELECT COUNT(*)
    FROM public.product_variants pv
    WHERE pv.product_id = p.id
)
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_variants'
);

-- Show sample data
SELECT 
    id,
    name,
    sku,
    category,
    base_price,
    total_inventory,
    variant_count,
    in_stock
FROM products
LIMIT 5;