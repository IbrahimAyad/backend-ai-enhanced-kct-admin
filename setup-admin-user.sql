-- Setup Admin User for KCT Admin Dashboard
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/gvcswimqaxvylgxbklbz/sql/new

-- Step 1: Check if any users exist
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager')),
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view their own record" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all admin records" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = 'super_admin'
    )
  );

-- Step 3: If support@kctmenswear.com exists, make them admin
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'support@kctmenswear.com';
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- User exists, make them admin
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            permissions = ARRAY['all'],
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'User % has been made super_admin', v_email;
    ELSE
        RAISE NOTICE 'User % not found. See Option 1 or 2 below.', v_email;
    END IF;
END $$;

-- Step 4: Check if admin@kctmenswear.com exists
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@kctmenswear.com';
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- User exists, make them admin
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            permissions = ARRAY['all'],
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'User % has been made super_admin', v_email;
    ELSE
        RAISE NOTICE 'User % not found. See Option 1 or 2 below.', v_email;
    END IF;
END $$;

-- Step 5: Show all current admin users
SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    u.email,
    u.created_at as user_created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- ============================================
-- OPTION 1: If no users exist, create one directly (REQUIRES SERVICE ROLE KEY)
-- ============================================
-- This must be run with service role permissions, not from SQL Editor
-- Use Supabase client library or API with service role key

-- ============================================
-- OPTION 2: Make ANY existing user an admin
-- ============================================
-- Uncomment and modify the email below to make any existing user an admin:

/*
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'YOUR_EMAIL@example.com'; -- Change this!
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            permissions = ARRAY['all'],
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'User % has been made super_admin', v_email;
    END IF;
END $$;
*/

-- ============================================
-- OPTION 3: Make the FIRST user in the system an admin
-- ============================================
-- Uncomment to make the oldest user account an admin:

/*
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    SELECT id, email INTO v_user_id, v_email
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            permissions = ARRAY['all'],
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'User % (first user) has been made super_admin', v_email;
    END IF;
END $$;
*/