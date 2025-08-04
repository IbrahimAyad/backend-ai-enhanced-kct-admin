-- Create missing tables identified in the project plan
-- These tables are essential for production readiness

-- ============================================
-- 1. EMAIL_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    sender_email TEXT DEFAULT 'noreply@kctmenswear.com',
    subject TEXT NOT NULL,
    template_id TEXT,
    template_data JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
    error_message TEXT,
    provider TEXT DEFAULT 'resend', -- or 'sendgrid', 'ses', etc.
    provider_message_id TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relations
    customer_id UUID REFERENCES public.customers(id),
    order_id UUID REFERENCES public.orders(id),
    
    -- Indexes for performance
    INDEX idx_email_logs_recipient (recipient_email),
    INDEX idx_email_logs_status (status),
    INDEX idx_email_logs_created_at (created_at),
    INDEX idx_email_logs_customer_id (customer_id)
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs" ON public.email_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['marketing'] OR permissions @> ARRAY['all'])
        )
    );

-- System can insert email logs
CREATE POLICY "System can insert email logs" ON public.email_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 2. CUSTOMER_SEGMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria JSONB NOT NULL, -- Dynamic segmentation criteria
    segment_type TEXT CHECK (segment_type IN ('manual', 'dynamic', 'smart')),
    is_active BOOLEAN DEFAULT true,
    customer_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Junction table for manual segments
CREATE TABLE IF NOT EXISTS public.customer_segment_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    
    UNIQUE(segment_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;

-- Admins can manage segments
CREATE POLICY "Admins can manage segments" ON public.customer_segments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['customers'] OR permissions @> ARRAY['all'])
        )
    );

CREATE POLICY "Admins can manage segment members" ON public.customer_segment_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['customers'] OR permissions @> ARRAY['all'])
        )
    );

-- ============================================
-- 3. ORDER_STATUS_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_system BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_order_status_history_order_id (order_id),
    INDEX idx_order_status_history_created_at (created_at)
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view history for their orders
CREATE POLICY "Users can view own order history" ON public.order_status_history
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders o
            WHERE o.customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
            OR o.guest_email IN (
                SELECT email FROM public.customers WHERE auth_user_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- System and admins can insert history
CREATE POLICY "System can insert history" ON public.order_status_history
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 4. INVENTORY_RESERVATIONS TABLE (Proper Implementation)
-- ============================================
-- Drop the old stock_reservations table if it exists
DROP TABLE IF EXISTS public.stock_reservations CASCADE;

CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reservation_type TEXT NOT NULL CHECK (reservation_type IN ('cart', 'checkout', 'manual')),
    expires_at TIMESTAMPTZ NOT NULL,
    session_id TEXT, -- For guest carts
    user_id UUID REFERENCES auth.users(id), -- For logged-in users
    order_id UUID REFERENCES public.orders(id), -- Once order is placed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for cleanup and queries
    INDEX idx_inventory_reservations_variant_id (variant_id),
    INDEX idx_inventory_reservations_expires_at (expires_at),
    INDEX idx_inventory_reservations_session_id (session_id),
    INDEX idx_inventory_reservations_user_id (user_id)
);

-- Enable RLS
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;

-- Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON public.inventory_reservations
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR (session_id IS NOT NULL AND user_id IS NULL) -- Guest sessions handled by app
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- System manages reservations
CREATE POLICY "System can manage reservations" ON public.inventory_reservations
    FOR ALL
    USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to clean up expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.inventory_reservations
    WHERE expires_at < NOW()
    AND order_id IS NULL; -- Don't delete if linked to an order
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dynamic customer segments
CREATE OR REPLACE FUNCTION public.calculate_customer_segment(segment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    segment_criteria JSONB;
    customer_count INTEGER;
BEGIN
    -- Get segment criteria
    SELECT criteria INTO segment_criteria
    FROM public.customer_segments
    WHERE id = segment_id AND segment_type = 'dynamic';
    
    IF segment_criteria IS NULL THEN
        RETURN 0;
    END IF;
    
    -- This is a placeholder - implement actual criteria logic
    -- based on your specific segmentation rules
    
    -- Update segment count
    UPDATE public.customer_segments
    SET customer_count = customer_count,
        last_calculated_at = NOW()
    WHERE id = segment_id;
    
    RETURN customer_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (
            order_id,
            previous_status,
            new_status,
            changed_by,
            changed_by_system,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            auth.uid() IS NULL,
            jsonb_build_object(
                'updated_at', NEW.updated_at,
                'total', NEW.total
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_change();

-- ============================================
-- GRANTS
-- ============================================
GRANT SELECT ON public.email_logs TO service_role;
GRANT ALL ON public.customer_segments TO authenticated;
GRANT ALL ON public.customer_segment_members TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.inventory_reservations TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_customer_segment(UUID) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    'NEW TABLES CREATED:' as info,
    tablename,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policies
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'email_logs',
    'customer_segments',
    'customer_segment_members',
    'order_status_history',
    'inventory_reservations'
)
ORDER BY tablename;