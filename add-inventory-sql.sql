-- Add inventory to all products
-- Run this in Supabase SQL Editor

-- First, update existing variants to add 10 more inventory
UPDATE product_variants
SET 
    inventory_quantity = COALESCE(inventory_quantity, 0) + 10,
    stock_quantity = COALESCE(stock_quantity, 0) + 10,
    available_quantity = COALESCE(stock_quantity, 0) + 10
WHERE product_id IN (SELECT id FROM products);

-- Create default variants for products that don't have any
INSERT INTO product_variants (product_id, title, sku, price, inventory_quantity, stock_quantity, available_quantity, available)
SELECT 
    p.id,
    'Default Size',
    p.sku || '-default',
    p.base_price,
    10,
    10,
    10,
    true
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);

-- Update products' total_inventory based on their variants
UPDATE products p
SET 
    total_inventory = (
        SELECT COALESCE(SUM(pv.stock_quantity), 0)
        FROM product_variants pv
        WHERE pv.product_id = p.id
    ),
    in_stock = (
        SELECT COALESCE(SUM(pv.stock_quantity), 0) > 0
        FROM product_variants pv
        WHERE pv.product_id = p.id
    );

-- Show results
SELECT 
    'Products with inventory' as metric,
    COUNT(*) as count
FROM products
WHERE total_inventory > 0

UNION ALL

SELECT 
    'Total variants with inventory',
    COUNT(*)
FROM product_variants
WHERE inventory_quantity > 0

UNION ALL

SELECT 
    'Total inventory across all products',
    SUM(total_inventory)
FROM products;

-- Sample of products with their inventory
SELECT 
    p.name,
    p.category,
    p.total_inventory,
    COUNT(pv.id) as variant_count,
    SUM(pv.inventory_quantity) as total_variant_inventory
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.category, p.total_inventory
ORDER BY p.created_at DESC
LIMIT 20;