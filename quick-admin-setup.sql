-- Quick Admin Setup for support@kctmenswear.com
-- Run this in Supabase SQL Editor

-- First, check if the user exists in auth.users
DO $$
DECLARE
    v_user_id UUID;
    v_customer_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'support@kctmenswear.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User support@kctmenswear.com not found in auth.users';
        RAISE NOTICE 'Please ensure the user has signed up first';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user with ID: %', v_user_id;

    -- Check if customer record exists
    SELECT id INTO v_customer_id
    FROM customers
    WHERE email = 'support@kctmenswear.com'
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        -- Create customer record if it doesn't exist
        INSERT INTO customers (email, auth_user_id, created_at, updated_at)
        VALUES ('support@kctmenswear.com', v_user_id, NOW(), NOW())
        RETURNING id INTO v_customer_id;
        
        RAISE NOTICE 'Created customer record with ID: %', v_customer_id;
    END IF;

    -- Check if already an admin
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_user_id) THEN
        RAISE NOTICE 'User is already an admin';
        
        -- Update to ensure they're active and have super_admin role
        UPDATE admin_users 
        SET role = 'super_admin', 
            permissions = ARRAY['all'], 
            is_active = true,
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated existing admin user to super_admin with all permissions';
    ELSE
        -- Create admin user
        INSERT INTO admin_users (user_id, role, permissions, is_active, created_at, updated_at)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true, NOW(), NOW());
        
        RAISE NOTICE 'Created new admin user with super_admin role';
    END IF;

    RAISE NOTICE 'Admin setup complete! User support@kctmenswear.com can now access the admin dashboard.';
END $$;

-- Verify the setup
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'support@kctmenswear.com';