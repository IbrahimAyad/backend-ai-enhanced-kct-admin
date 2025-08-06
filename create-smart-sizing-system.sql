-- Smart Sizing System with AI Features
-- This creates the complete dynamic sizing system for KCT Menswear

-- 1. Size Templates Table (Category-based sizing rules)
CREATE TABLE IF NOT EXISTS public.size_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    template_name VARCHAR(100) NOT NULL,
    sizes JSONB NOT NULL,
    display_type VARCHAR(20) DEFAULT 'grid', -- 'grid', 'dropdown', 'two_step'
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Smart Product Tags (AI-powered features)
CREATE TABLE IF NOT EXISTS public.product_smart_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    tag_type VARCHAR(50) NOT NULL, -- 'occasion', 'style', 'season', 'body_type', 'recommendation'
    tag_value VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- AI confidence 0.00-1.00
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai', 'user_behavior'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Size Recommendations (Smart sizing suggestions)
CREATE TABLE IF NOT EXISTS public.size_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_measurements JSONB, -- {"chest": 42, "waist": 34, "height": "5'10"}
    recommended_size VARCHAR(20),
    confidence_score DECIMAL(3,2),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Product Intelligence Analytics
CREATE TABLE IF NOT EXISTS public.product_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    metric_type VARCHAR(50), -- 'view_count', 'conversion_rate', 'size_popularity', 'return_rate'
    metric_value DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    metadata JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Smart Bundles & Recommendations
CREATE TABLE IF NOT EXISTS public.smart_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    recommended_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50), -- 'frequently_together', 'similar_style', 'complete_look', 'size_alternative'
    strength DECIMAL(3,2) DEFAULT 1.0,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Size Templates
INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
-- Suits Template
('suits', 'Standard Suit Sizes', '{
  "short": ["36S", "38S", "40S", "42S", "44S", "46S", "48S"],
  "regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"],
  "long": ["38L", "40L", "42L", "44L", "46L", "48L", "50L", "52L", "54L"],
  "popular_sizes": ["40R", "42R", "44R"],
  "size_chart_url": "/size-guides/suits"
}', 'grid', true),

-- Blazers Template  
('blazers', 'Standard Blazer Sizes', '{
  "regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"],
  "popular_sizes": ["40R", "42R", "44R"],
  "size_chart_url": "/size-guides/blazers"
}', 'grid', true),

-- Dress Shirts Template
('dress_shirts', 'Dress Shirt Sizing', '{
  "neck_sizes": ["15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5", "19", "19.5", "20", "22"],
  "sleeve_lengths": ["32-33", "34-35", "36-37"],
  "fit_types": ["slim_cut", "classic_fit"],
  "popular_combinations": ["16/34-35", "16.5/34-35", "17/34-35"],
  "size_chart_url": "/size-guides/dress-shirts"
}', 'two_step', true),

-- Sweaters Template
('sweaters', 'Standard Sweater Sizes', '{
  "sizes": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  "measurements": {
    "S": "15-15.5 neck",
    "M": "15.5-16 neck", 
    "L": "16-16.5 neck",
    "XL": "16.5-17 neck",
    "2XL": "17-17.5 neck",
    "3XL": "17.5-18 neck",
    "4XL": "18+ neck"
  },
  "popular_sizes": ["M", "L", "XL"]
}', 'dropdown', true),

-- Dress Shoes Template
('dress_shoes', 'Dress Shoe Sizes', '{
  "whole_sizes": [8, 9, 10, 11, 12, 13],
  "half_sizes_available": true,
  "width_options": ["D", "E", "EE"],
  "popular_sizes": [9, 10, 11, 12],
  "size_chart_url": "/size-guides/shoes"
}', 'dropdown', true),

-- Ties & Bowties Template
('ties', 'Tie Sizing', '{
  "styles": ["pre_tied", "classic", "skinny", "slim"],
  "widths": {
    "pre_tied": "adjustable",
    "classic": "3.25 inches",
    "skinny": "2.75 inches", 
    "slim": "2.25 inches"
  },
  "one_size_fits_most": true
}', 'dropdown', true);

-- Insert Smart Tags for existing products (based on categories we saw)
INSERT INTO public.product_smart_tags (product_id, tag_type, tag_value, source) 
SELECT 
    p.id,
    'occasion',
    CASE 
        WHEN p.category ILIKE '%velvet%' THEN 'formal_events'
        WHEN p.category ILIKE '%prom%' THEN 'prom_formal'
        WHEN p.category ILIKE '%wedding%' THEN 'wedding'
        WHEN p.category ILIKE '%sparkle%' THEN 'special_events'
        WHEN p.category ILIKE '%suit%' THEN 'business_formal'
        WHEN p.category ILIKE '%dress_shirt%' THEN 'business_professional'
        ELSE 'versatile'
    END,
    'ai'
FROM public.products p 
WHERE p.category IS NOT NULL;

-- Add style tags
INSERT INTO public.product_smart_tags (product_id, tag_type, tag_value, source)
SELECT 
    p.id,
    'style',
    CASE 
        WHEN p.name ILIKE '%navy%' THEN 'classic'
        WHEN p.name ILIKE '%black%' THEN 'timeless'
        WHEN p.name ILIKE '%velvet%' THEN 'luxury'
        WHEN p.name ILIKE '%sparkle%' OR p.name ILIKE '%sequin%' THEN 'statement'
        WHEN p.name ILIKE '%slim%' THEN 'modern'
        ELSE 'classic'
    END,
    'ai'
FROM public.products p;

-- Add seasonal tags
INSERT INTO public.product_smart_tags (product_id, tag_type, tag_value, source)
SELECT 
    p.id,
    'season',
    CASE 
        WHEN p.name ILIKE '%summer%' THEN 'summer'
        WHEN p.name ILIKE '%velvet%' THEN 'fall_winter'
        WHEN p.name ILIKE '%linen%' THEN 'spring_summer'
        ELSE 'year_round'
    END,
    'ai'
FROM public.products p;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_size_templates_category ON public.size_templates(category);
CREATE INDEX IF NOT EXISTS idx_product_smart_tags_product_id ON public.product_smart_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_smart_tags_type_value ON public.product_smart_tags(tag_type, tag_value);
CREATE INDEX IF NOT EXISTS idx_size_recommendations_product_id ON public.size_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_base_product ON public.smart_recommendations(base_product_id);

-- Create RLS policies (following existing pattern)
ALTER TABLE public.size_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_smart_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_recommendations ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_size_templates" ON public.size_templates FOR SELECT USING (true);
CREATE POLICY "public_read_product_smart_tags" ON public.product_smart_tags FOR SELECT USING (true);
CREATE POLICY "public_read_size_recommendations" ON public.size_recommendations FOR SELECT USING (true);
CREATE POLICY "public_read_product_analytics" ON public.product_analytics FOR SELECT USING (true);
CREATE POLICY "public_read_smart_recommendations" ON public.smart_recommendations FOR SELECT USING (true);

-- Verification queries
SELECT 'Size Templates Created:' as info, COUNT(*) as count FROM public.size_templates;
SELECT 'Smart Tags Created:' as info, COUNT(*) as count FROM public.product_smart_tags;
SELECT 'Categories with templates:' as info, STRING_AGG(DISTINCT category, ', ') as categories FROM public.size_templates;

-- Show sample smart tags
SELECT 
    p.name,
    p.category,
    pst.tag_type,
    pst.tag_value
FROM public.products p
JOIN public.product_smart_tags pst ON p.id = pst.product_id
LIMIT 10;