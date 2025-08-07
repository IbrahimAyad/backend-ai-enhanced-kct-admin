-- Check if our smart sizing system was installed correctly

-- 1. Check if size_templates table exists and has data
SELECT 'Size Templates Check' as check_type, COUNT(*) as template_count
FROM public.size_templates;

-- 2. Show all size templates
SELECT 
    'Size Templates' as info,
    category,
    template_name,
    display_type,
    is_default,
    is_active
FROM public.size_templates
ORDER BY category;

-- 3. Check sample size data for suits
SELECT 
    'Suits Template Data' as info,
    sizes
FROM public.size_templates
WHERE category = 'suits';

-- 4. Check if product_variants have the new sizing fields
SELECT 
    'Variant Fields Check' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'product_variants'
AND column_name IN ('option1', 'option2', 'size_display', 'available')
ORDER BY column_name;

-- 5. Check how many variants exist with size data
SELECT 
    'Variants with Sizes' as info,
    COUNT(*) as total_variants,
    COUNT(option1) as variants_with_option1,
    COUNT(option2) as variants_with_option2
FROM public.product_variants;

-- 6. Sample variant data
SELECT 
    'Sample Variants' as info,
    pv.sku,
    pv.option1,
    pv.option2,
    pv.inventory_quantity,
    p.name as product_name,
    p.category
FROM public.product_variants pv
JOIN public.products p ON pv.product_id = p.id
LIMIT 10;

-- 7. Check if smart tags were created
SELECT 'Smart Tags Check' as check_type, COUNT(*) as tag_count
FROM public.product_smart_tags;

-- 8. Show sample smart tags
SELECT 
    'Sample Smart Tags' as info,
    pst.tag_type,
    pst.tag_value,
    p.name as product_name
FROM public.product_smart_tags pst
JOIN public.products p ON pst.product_id = p.id
LIMIT 10;