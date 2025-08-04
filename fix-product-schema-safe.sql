-- Fix Product Schema to match ProductManagement component expectations
-- Run this in Supabase SQL Editor

-- First, let's check what columns already exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- 1. Add missing columns to products table (if they don't exist)
DO $$ 
BEGIN
    -- Add price_range column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price_range') THEN
        ALTER TABLE public.products ADD COLUMN price_range JSONB;
    END IF;
    
    -- Add total_inventory column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'total_inventory') THEN
        ALTER TABLE public.products ADD COLUMN total_inventory INTEGER DEFAULT 0;
    END IF;
    
    -- Add primary_image column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'primary_image') THEN
        ALTER TABLE public.products ADD COLUMN primary_image TEXT;
    END IF;
    
    -- Add variant_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'variant_count') THEN
        ALTER TABLE public.products ADD COLUMN variant_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add in_stock column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'in_stock') THEN
        ALTER TABLE public.products ADD COLUMN in_stock BOOLEAN DEFAULT true;
    END IF;
    
    -- Add image_gallery column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_gallery') THEN
        ALTER TABLE public.products ADD COLUMN image_gallery TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Check if product_variants table exists and add missing columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
        -- Add available_quantity column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'available_quantity') THEN
            ALTER TABLE public.product_variants ADD COLUMN available_quantity INTEGER DEFAULT 0;
        END IF;
        
        -- Add reserved_quantity column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'reserved_quantity') THEN
            ALTER TABLE public.product_variants ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
        END IF;
        
        -- Add stock_quantity column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'stock_quantity') THEN
            ALTER TABLE public.product_variants ADD COLUMN stock_quantity INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- 3. Create inventory table only if product_variants exists
DO $$ 
BEGIN
    -- Only create inventory table if product_variants exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        
        CREATE TABLE public.inventory (
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
        CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
        CREATE INDEX idx_inventory_variant_id ON public.inventory(variant_id);

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
    END IF;
END $$;

-- 4. Create a simpler function to update product inventory (without variant dependency)
CREATE OR REPLACE FUNCTION update_product_inventory_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- For now, just update the variant_count
    UPDATE public.products p
    SET variant_count = (
        SELECT COUNT(*)
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if product_variants table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
        DROP TRIGGER IF EXISTS update_product_inventory_trigger ON public.product_variants;
        CREATE TRIGGER update_product_inventory_trigger
            AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
            FOR EACH ROW
            EXECUTE FUNCTION update_product_inventory_simple();
    END IF;
END $$;

-- 5. Update existing products with calculated values (safe version)
UPDATE public.products p
SET 
    variant_count = COALESCE((
        SELECT COUNT(*)
        FROM public.product_variants pv
        WHERE pv.product_id = p.id
    ), 0),
    in_stock = true; -- Default to true for now

-- 6. Verify the updates
SELECT 
    'Products table columns:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name IN ('price_range', 'total_inventory', 'primary_image', 'variant_count', 'in_stock', 'image_gallery')
ORDER BY column_name;

-- 7. Check if product_variants exists and show its columns
SELECT 
    'Product variants table:' as info;
    
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants')
        THEN 'Table exists'
        ELSE 'Table does not exist'
    END as status;

-- 8. Show sample product data
SELECT 
    'Sample products:' as info;
    
SELECT 
    id,
    name,
    total_inventory,
    variant_count,
    in_stock,
    price_range
FROM products
LIMIT 5;