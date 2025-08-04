-- Check Product Table Schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Check Product Variants Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- Check Product Images Table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'product_images'
ORDER BY ordinal_position;

-- Check if we have the inventory table (component expects it)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory'
) as inventory_table_exists;

-- Check sample product data
SELECT 
    id,
    name,
    sku,
    category,
    status,
    base_price,
    is_bundleable
FROM products 
LIMIT 5;