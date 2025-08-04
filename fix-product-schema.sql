-- Fix Product Schema to match ProductManagement component expectations
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_range JSONB,
ADD COLUMN IF NOT EXISTS total_inventory INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS primary_image TEXT,
ADD COLUMN IF NOT EXISTS variant_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS image_gallery TEXT[] DEFAULT '{}';

-- 2. Add missing columns to product_variants table  
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS available_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 3. Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    warehouse_location TEXT,
    last_restock_date TIMESTAMPTZ,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON public.inventory(variant_id);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage inventory" ON public.inventory
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 4. Create a function to update product total_inventory
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the product's total inventory
    UPDATE public.products
    SET total_inventory = (
        SELECT COALESCE(SUM(pv.stock_quantity), 0)
        FROM public.product_variants pv
        WHERE pv.product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    in_stock = (
        SELECT EXISTS(
            SELECT 1 FROM public.product_variants pv
            WHERE pv.product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND pv.stock_quantity > 0
        )
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_variants changes
DROP TRIGGER IF EXISTS update_product_inventory_trigger ON public.product_variants;
CREATE TRIGGER update_product_inventory_trigger
    AFTER INSERT OR UPDATE OF stock_quantity OR DELETE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_inventory();

-- 5. Update existing products with calculated values
UPDATE public.products p
SET 
    total_inventory = COALESCE((
        SELECT SUM(pv.stock_quantity)
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
    ), 0),
    variant_count = COALESCE((
        SELECT COUNT(*)
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
    ), 0),
    in_stock = EXISTS(
        SELECT 1 FROM public.product_variants pv
        WHERE pv.product_id = p.id
        AND pv.stock_quantity > 0
    ),
    price_range = (
        SELECT jsonb_build_object(
            'min', MIN(pv.price),
            'max', MAX(pv.price)
        )
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
    );

-- 6. Verify the schema updates
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name IN ('price_range', 'total_inventory', 'primary_image', 'variant_count', 'in_stock', 'image_gallery')
ORDER BY column_name;

-- 7. Check sample data
SELECT 
    id,
    name,
    total_inventory,
    variant_count,
    in_stock,
    price_range
FROM products
LIMIT 5;