-- Create initial admin user (run this manually after deployment)
-- IMPORTANT: Change the email and password before running!

-- First, create a user in auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@kctmenswear.com', -- Change this email
    crypt('ChangeThisPassword123!', gen_salt('bf')), -- Change this password
    NOW(),
    '{"role": "admin"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Then add them to admin_users table
INSERT INTO admin_users (
    user_id,
    email,
    full_name,
    role,
    permissions,
    is_active
)
SELECT 
    id,
    email,
    'KCT Admin',
    'super_admin',
    '["all"]'::jsonb,
    true
FROM auth.users
WHERE email = 'admin@kctmenswear.com' -- Use same email as above
ON CONFLICT (user_id) DO NOTHING;

-- Grant admin access to all tables
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@kctmenswear.com';
    
    -- You can add additional permissions here if needed
    RAISE NOTICE 'Admin user created with ID: %', admin_id;
END $$;