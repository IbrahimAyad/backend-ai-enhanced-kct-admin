-- Smart Sizing System - Clean Version
-- No markdown formatting, pure SQL

-- 1. Size Templates Table
CREATE TABLE IF NOT EXISTS public.size_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    template_name VARCHAR(100) NOT NULL,
    sizes JSONB NOT NULL,
    display_type VARCHAR(20) DEFAULT 'grid',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Smart Product Tags
CREATE TABLE IF NOT EXISTS public.product_smart_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    tag_type VARCHAR(50) NOT NULL,
    tag_value VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Size Recommendations
CREATE TABLE IF NOT EXISTS public.size_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_measurements JSONB,
    recommended_size VARCHAR(20),
    confidence_score DECIMAL(3,2),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Product Analytics
CREATE TABLE IF NOT EXISTS public.product_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    metric_type VARCHAR(50),
    metric_value DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    metadata JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Smart Recommendations
CREATE TABLE IF NOT EXISTS public.smart_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    recommended_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50),
    strength DECIMAL(3,2) DEFAULT 1.0,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Size Templates (Clean JSON)
INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('suits', 'Standard Suit Sizes', '{"short": ["36S", "38S", "40S", "42S", "44S", "46S", "48S"], "regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"], "long": ["38L", "40L", "42L", "44L", "46L", "48L", "50L", "52L", "54L"], "popular_sizes": ["40R", "42R", "44R"]}', 'grid', true);

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('blazers', 'Standard Blazer Sizes', '{"regular": ["36R", "38R", "40R", "42R", "44R", "46R", "48R", "50R", "52R", "54R"], "popular_sizes": ["40R", "42R", "44R"]}', 'grid', true);

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('dress_shirts', 'Dress Shirt Sizing', '{"neck_sizes": ["15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5", "19", "19.5", "20", "22"], "sleeve_lengths": ["32-33", "34-35", "36-37"], "fit_types": ["slim_cut", "classic_fit"]}', 'two_step', true);

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('sweaters', 'Standard Sweater Sizes', '{"sizes": ["S", "M", "L", "XL", "2XL", "3XL", "4XL"], "popular_sizes": ["M", "L", "XL"]}', 'dropdown', true);

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('dress_shoes', 'Dress Shoe Sizes', '{"whole_sizes": [8, 9, 10, 11, 12, 13], "half_sizes_available": true, "popular_sizes": [9, 10, 11, 12]}', 'dropdown', true);

INSERT INTO public.size_templates (category, template_name, sizes, display_type, is_default) VALUES
('ties', 'Tie Sizing', '{"styles": ["pre_tied", "classic", "skinny", "slim"], "one_size_fits_most": true}', 'dropdown', true);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_size_templates_category ON public.size_templates(category);
CREATE INDEX IF NOT EXISTS idx_product_smart_tags_product_id ON public.product_smart_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_smart_tags_type_value ON public.product_smart_tags(tag_type, tag_value);

-- RLS Policies
ALTER TABLE public.size_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_smart_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_size_templates" ON public.size_templates FOR SELECT USING (true);
CREATE POLICY "public_read_product_smart_tags" ON public.product_smart_tags FOR SELECT USING (true);
CREATE POLICY "public_read_size_recommendations" ON public.size_recommendations FOR SELECT USING (true);
CREATE POLICY "public_read_product_analytics" ON public.product_analytics FOR SELECT USING (true);
CREATE POLICY "public_read_smart_recommendations" ON public.smart_recommendations FOR SELECT USING (true);

-- Verification
SELECT 'Tables Created Successfully' as status;
SELECT COUNT(*) as template_count FROM public.size_templates;
SELECT category, template_name FROM public.size_templates ORDER BY category;