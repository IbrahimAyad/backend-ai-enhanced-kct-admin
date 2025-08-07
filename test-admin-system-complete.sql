-- COMPREHENSIVE ADMIN SYSTEM TEST
-- Run this in Supabase Dashboard SQL Editor to verify everything is working

-- 1. Quick Status Check
SELECT
    'SYSTEM STATUS CHECK' as test_section,
    (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
    (SELECT COUNT(*) FROM product_images) as total_images,
    (SELECT COUNT(*) FROM product_variants) as total_variants,
    (SELECT COUNT(*) FROM size_templates) as size_templates,
    EXISTS(SELECT 1 FROM admin_users WHERE role = 'super_admin') as admin_exists;

-- 2. Check Admin User Setup
SELECT
    'ADMIN USER CHECK' as test_section,
    au.role,
    au.permissions,
    au.is_active,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.is_active = true;

-- 3. Verify RLS Policies (should be non-circular)
SELECT
    'RLS POLICIES CHECK' as test_section,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'admin_users' AND schemaname = 'public'
ORDER BY policyname;

-- 4. Sample Products with Size Variants
SELECT
    'SIZING SYSTEM CHECK' as test_section,
    p.name,
    p.category,
    COUNT(pv.*) as variant_count,
    STRING_AGG(DISTINCT pv.option1, ', ' ORDER BY pv.option1) as available_sizes,
    SUM(pv.inventory_quantity) as total_inventory
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.category
ORDER BY variant_count DESC
LIMIT 10;

-- 5. Size Templates Available
SELECT
    'SIZE TEMPLATES CHECK' as test_section,
    category,
    template_name,
    display_type,
    is_default,
    is_active
FROM size_templates
WHERE is_active = true
ORDER BY category;

-- 6. Product Images Status
SELECT
    'IMAGES CHECK' as test_section,
    COUNT(*) as total_images,
    COUNT(DISTINCT product_id) as products_with_images,
    COUNT(CASE WHEN image_type = 'primary' THEN 1 END) as primary_images,
    COUNT(CASE WHEN r2_url IS NOT NULL THEN 1 END) as images_with_urls
FROM product_images;

-- 7. Inventory Summary by Category
SELECT
    'INVENTORY BY CATEGORY' as test_section,
    p.category,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(pv.*) as total_variants,
    SUM(pv.inventory_quantity) as total_inventory,
    ROUND(AVG(pv.inventory_quantity), 1) as avg_inventory_per_variant
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.status = 'active'
GROUP BY p.category
ORDER BY total_inventory DESC;

-- 8. Sample Size Data Structure
SELECT
    'SIZE DATA STRUCTURE' as test_section,
    p.name,
    pv.option1 as size,
    pv.option2 as color_or_fit,
    pv.size_display,
    pv.inventory_quantity,
    pv.available,
    pv.title
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.category ILIKE '%suit%'
ORDER BY p.name, pv.option1
LIMIT 15;

-- 9. Test Data Quality
SELECT
    'DATA QUALITY CHECK' as test_section,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as products_missing_names,
    COUNT(CASE WHEN category IS NULL OR category = '' THEN 1 END) as products_missing_category,
    COUNT(CASE WHEN price IS NULL OR price <= 0 THEN 1 END) as products_invalid_price,
    COUNT(CASE WHEN status NOT IN ('active', 'inactive', 'draft') THEN 1 END) as products_invalid_status
FROM products;

-- 10. Final Success Summary
SELECT
    'FINAL SYSTEM STATUS' as test_section,
    CASE 
        WHEN 
            (SELECT COUNT(*) FROM products WHERE status = 'active') > 100 AND
            (SELECT COUNT(*) FROM product_variants) > 1000 AND
            (SELECT COUNT(*) FROM size_templates WHERE is_active = true) >= 4 AND
            EXISTS(SELECT 1 FROM admin_users WHERE role = 'super_admin' AND is_active = true)
        THEN '✅ SYSTEM FULLY OPERATIONAL'
        ELSE '❌ ISSUES DETECTED - CHECK ABOVE RESULTS'
    END as overall_status;