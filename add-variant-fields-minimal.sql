-- Minimal migration: Add only the essential fields needed by frontend

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

-- Verify the new columns were added
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