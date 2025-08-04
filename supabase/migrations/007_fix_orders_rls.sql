-- Fix RLS for orders table based on actual schema
-- First, let's check what columns link orders to customers/users

-- Check if orders table has customer_id or user_id
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('customer_id', 'user_id', 'auth_user_id', 'guest_email', 'customer_email')
ORDER BY ordinal_position;

-- Check foreign key relationships for orders
SELECT
    kcu.column_name as orders_column, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'orders';

-- Now let's fix the RLS based on what we find
DO $$
DECLARE
    has_customer_id boolean;
    has_user_id boolean;
    has_guest_email boolean;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'customer_id'
    ) INTO has_customer_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'guest_email'
    ) INTO has_guest_email;
    
    -- Add customer_id if it doesn't exist
    IF NOT has_customer_id AND NOT has_user_id THEN
        RAISE NOTICE 'Adding customer_id column to orders table';
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id);
        CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
    END IF;
END $$;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;

-- Create new policies based on available columns
-- Policy 1: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (
        -- If orders has customer_id, match through customers table
        (EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'customer_id'
        ) AND customer_id IN (
            SELECT id FROM public.customers 
            WHERE auth_user_id = auth.uid()
        ))
        OR
        -- If orders has user_id, match directly
        (EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'user_id'
        ) AND user_id = auth.uid())
        OR
        -- If orders has guest_email, match through customers email
        (EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'orders' 
            AND column_name = 'guest_email'
        ) AND guest_email IN (
            SELECT email FROM public.customers 
            WHERE auth_user_id = auth.uid()
        ))
        OR
        -- Allow admins to see all
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Policy 2: Service/Admin can create orders
CREATE POLICY "Service role can create orders" ON public.orders
    FOR INSERT
    WITH CHECK (
        -- Allow if user is authenticated (will be restricted by Edge Functions)
        auth.uid() IS NOT NULL
        OR
        -- Allow admins
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Policy 3: Admins can update orders
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

-- Grant permissions
GRANT SELECT ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO authenticated; -- Edge functions need this

-- Show the final structure
SELECT 
    'Final orders structure:' as info,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND column_name IN ('id', 'customer_id', 'user_id', 'guest_email', 'status', 'total', 'created_at')
ORDER BY ordinal_position;