-- Corrected RLS for orders table based on actual schema
-- The orders table has both customer_id and guest_email columns

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Policy 1: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (
        -- Match orders by customer_id (for logged-in users)
        customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR
        -- Match orders by email for users who made guest purchases
        guest_email IN (
            SELECT email FROM public.customers 
            WHERE auth_user_id = auth.uid()
        )
        OR
        -- Allow admins to see all orders
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Policy 2: System/Edge Functions can create orders
-- This is permissive because actual order creation happens via Edge Functions with service role
CREATE POLICY "System can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (true);

-- Policy 3: Only admins can update orders (status changes, etc.)
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['orders'] OR permissions @> ARRAY['all'])
        )
    );

-- Policy 4: Only admins can delete orders (if ever needed)
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND permissions @> ARRAY['all']
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.orders TO anon; -- For order confirmation pages
GRANT INSERT ON public.orders TO service_role; -- For Edge Functions

-- Now let's also handle ORDER_ITEMS table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'order_items'
    ) THEN
        -- Enable RLS on order_items
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
        
        -- Users can view items from their orders
        CREATE POLICY "Users can view own order items" ON public.order_items
            FOR SELECT
            USING (
                order_id IN (
                    SELECT id FROM public.orders o
                    WHERE 
                        -- Match by customer_id
                        o.customer_id IN (
                            SELECT id FROM public.customers 
                            WHERE auth_user_id = auth.uid()
                        )
                        OR
                        -- Match by guest_email
                        o.guest_email IN (
                            SELECT email FROM public.customers 
                            WHERE auth_user_id = auth.uid()
                        )
                )
                OR
                -- Admins can see all
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid()
                    AND is_active = true
                )
            );
        
        -- Grant permissions
        GRANT SELECT ON public.order_items TO authenticated;
        GRANT SELECT ON public.order_items TO anon;
    END IF;
END $$;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;