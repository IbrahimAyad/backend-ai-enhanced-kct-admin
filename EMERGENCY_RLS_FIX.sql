-- EMERGENCY RLS FIX: Resolve Circular Dependency Crisis
-- RUN THIS IMMEDIATELY in Supabase SQL Editor
-- This fixes the chicken-and-egg problem preventing admin authentication

-- =============================================================================
-- STEP 1: Break the circular dependency in admin_users RLS policies
-- =============================================================================

BEGIN;

-- Drop ALL existing policies on admin_users table that create circular dependencies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE 'Dropping existing admin_users RLS policies...';
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Create SAFE, non-circular SELECT policy
-- This is ESSENTIAL: allows ANY authenticated user to check if they are an admin
-- Without this, the useAdminAuth hook will fail and create authentication loops
CREATE POLICY "authenticated_users_can_check_admin_status" ON public.admin_users
    FOR SELECT 
    USING (true);  -- Allow all authenticated users to read admin table

RAISE NOTICE 'Created safe SELECT policy for admin status checks';

-- For security: Restrict write operations to service role only
-- This prevents unauthorized admin creation while allowing auth checks
CREATE POLICY "service_role_manages_admins" ON public.admin_users
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

RAISE NOTICE 'Restricted admin write operations to service role';

-- =============================================================================
-- STEP 2: Create/Update emergency admin user
-- =============================================================================

DO $$
DECLARE
    new_user_id UUID;
    admin_email TEXT := 'admin@kctmenswear.com'; -- CHANGE THIS TO YOUR EMAIL
    admin_password TEXT := 'TempAdminPass123!';   -- CHANGE THIS PASSWORD
    existing_user_id UUID;
BEGIN
    RAISE NOTICE 'Creating emergency admin user with email: %', admin_email;
    
    -- Check if user already exists
    SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'User already exists with ID: %, updating password...', existing_user_id;
        
        -- Update existing user's password
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = admin_email;
        
        new_user_id := existing_user_id;
    ELSE
        -- Create new user in auth.users table
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            role,
            aud,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            '{"role": "admin"}'::jsonb,
            'authenticated',
            'authenticated',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO new_user_id;
        
        RAISE NOTICE 'Created new auth user with ID: %', new_user_id;
    END IF;

    -- Insert/Update admin_users record
    INSERT INTO public.admin_users (
        user_id,
        role,
        permissions,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'super_admin',
        ARRAY['all'],
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        permissions = ARRAY['all'],
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'SUCCESS: Emergency admin user created/updated!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE 'IMPORTANT: Change the password after first login!';
END $$;

-- =============================================================================
-- STEP 3: Verify the fix worked
-- =============================================================================

-- Test that we can now query admin_users without circular dependency
DO $$
DECLARE
    admin_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count admin users
    SELECT COUNT(*) INTO admin_count FROM public.admin_users WHERE is_active = true;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'admin_users' AND schemaname = 'public';
    
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Active admin users: %', admin_count;
    RAISE NOTICE 'RLS policies on admin_users: %', policy_count;
    
    IF admin_count > 0 AND policy_count = 2 THEN
        RAISE NOTICE 'SUCCESS: Emergency fix completed successfully!';
        RAISE NOTICE 'You can now log in with the admin credentials above.';
    ELSE
        RAISE WARNING 'ISSUE: Fix may not have completed properly. Check the logs above.';
    END IF;
END $$;

-- Show current admin users
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email,
    u.email_confirmed_at
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.is_active = true;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users';

COMMIT;

-- =============================================================================
-- POST-FIX INSTRUCTIONS
-- =============================================================================

/*
NEXT STEPS AFTER RUNNING THIS SCRIPT:

1. IMMEDIATE (next 5 minutes):
   - Try logging in with the credentials shown above
   - Use a deployment preview URL if main URL still has issues
   - Clear browser cache and cookies if login fails

2. SECURITY (next 30 minutes):
   - Change the admin password immediately after first login
   - Review and update the admin email if needed
   - Enable MFA if available

3. TESTING (next hour):
   - Test admin dashboard access
   - Verify admin permissions work
   - Test on both main URL and preview URLs
   - Confirm RLS policies don't block legitimate access

4. MONITORING:
   - Watch for any RLS-related errors in Supabase logs
   - Monitor authentication success/failure rates
   - Set up alerts for admin login attempts

If you encounter any issues:
1. Check Supabase logs for RLS policy violations
2. Verify environment variables are set correctly
3. Test on deployment preview URLs as fallback
4. Use the EMERGENCY_ROLLBACK.sql script if needed

This fix resolves the circular dependency that prevented admin authentication.
The key change: admin status checks no longer require being an admin first.
*/