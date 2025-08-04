-- Migration to add auth_user_id to customers table and enable RLS
-- This migration handles the missing auth_user_id column issue

-- 1. Add auth_user_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 2. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- 3. Try to link existing customers to auth users based on email
UPDATE public.customers c
SET auth_user_id = u.id
FROM auth.users u
WHERE LOWER(c.email) = LOWER(u.email)
AND c.auth_user_id IS NULL;

-- 4. Show how many customers were linked
DO $$
DECLARE
    linked_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO linked_count FROM public.customers WHERE auth_user_id IS NOT NULL;
    SELECT COUNT(*) INTO total_count FROM public.customers;
    RAISE NOTICE 'Linked % out of % customers to auth users', linked_count, total_count;
END $$;

-- 5. Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 6. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can create customer record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customer records" ON public.customers;

-- 7. Create RLS policies for customers table

-- Policy: Users can view their own customer record
CREATE POLICY "Users can view own customer record" ON public.customers
    FOR SELECT
    USING (
        auth_user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Policy: Users can update their own customer record
CREATE POLICY "Users can update own customer record" ON public.customers
    FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Policy: Users can create a customer record for themselves
CREATE POLICY "Users can create own customer record" ON public.customers
    FOR INSERT
    WITH CHECK (
        auth_user_id = auth.uid() 
        OR auth_user_id IS NULL -- Allow creating without auth_user_id for guest checkout
    );

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all customers" ON public.customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND (permissions @> ARRAY['customers'] OR permissions @> ARRAY['all'])
        )
    );

-- 8. Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT SELECT ON public.customers TO anon; -- For guest checkout flow

-- 9. Add a trigger to automatically link new customers to auth users
CREATE OR REPLACE FUNCTION public.link_customer_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- If auth_user_id is not set but email matches an auth user, link them
    IF NEW.auth_user_id IS NULL AND NEW.email IS NOT NULL THEN
        SELECT id INTO NEW.auth_user_id
        FROM auth.users
        WHERE LOWER(email) = LOWER(NEW.email)
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS link_customer_to_auth_trigger ON public.customers;
CREATE TRIGGER link_customer_to_auth_trigger
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.link_customer_to_auth();

-- 10. Create a function to manually link a customer to current user
CREATE OR REPLACE FUNCTION public.claim_customer_record(customer_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    customer_exists BOOLEAN;
BEGIN
    -- Get current user id
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check if customer exists with this email
    SELECT EXISTS(
        SELECT 1 FROM public.customers 
        WHERE LOWER(email) = LOWER(customer_email)
        AND auth_user_id IS NULL
    ) INTO customer_exists;
    
    IF NOT customer_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Link the customer to current user
    UPDATE public.customers
    SET auth_user_id = current_user_id,
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(customer_email)
    AND auth_user_id IS NULL;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the claim function
GRANT EXECUTE ON FUNCTION public.claim_customer_record(TEXT) TO authenticated;

-- Summary of what this migration does:
-- 1. Adds auth_user_id column to link customers to auth users
-- 2. Links existing customers based on email match
-- 3. Enables RLS with proper policies
-- 4. Allows users to see/edit only their own records
-- 5. Allows admins to see/edit all records
-- 6. Automatically links new customers to auth users by email
-- 7. Provides a function to claim orphaned customer records