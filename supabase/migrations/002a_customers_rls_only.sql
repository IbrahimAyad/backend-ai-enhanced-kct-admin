-- Simple RLS for customers table only
-- Run this first to test and understand your schema

-- 1. First, let's see what columns the customers table has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. Check if auth_user_id column exists
DO $$
DECLARE
    column_exists boolean;
    auth_column_name text;
BEGIN
    -- Check for auth_user_id
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'auth_user_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'auth_user_id column exists';
        auth_column_name := 'auth_user_id';
    ELSE
        -- Check for user_id
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'user_id'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE 'user_id column exists (not auth_user_id)';
            auth_column_name := 'user_id';
        ELSE
            RAISE NOTICE 'No auth-related column found. Will create auth_user_id';
            -- Add the column
            ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
            auth_column_name := 'auth_user_id';
        END IF;
    END IF;
END $$;

-- 3. Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. Create a simple policy for testing
-- This uses a dynamic approach to handle different column names
CREATE OR REPLACE FUNCTION public.customer_owns_record()
RETURNS boolean AS $$
BEGIN
    -- Check if auth_user_id column exists and matches
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'auth_user_id'
    ) THEN
        RETURN (SELECT auth_user_id = auth.uid() FROM public.customers WHERE id = id);
    -- Check if user_id column exists and matches
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'user_id'
    ) THEN
        RETURN (SELECT user_id = auth.uid() FROM public.customers WHERE id = id);
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customer records" ON public.customers;

-- Create simple SELECT policy
CREATE POLICY "Users can view own customer record" ON public.customers
    FOR SELECT
    USING (
        -- Allow if auth_user_id matches current user
        (EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'auth_user_id'
        ) AND auth_user_id = auth.uid())
        OR
        -- Allow if user_id matches current user (alternative column name)
        (EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'user_id'
        ) AND user_id = auth.uid())
        OR
        -- Allow admins to see all
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Simple INSERT policy for new customers
CREATE POLICY "Users can create their customer record" ON public.customers
    FOR INSERT
    WITH CHECK (true); -- Allow all authenticated users to create customer records

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;