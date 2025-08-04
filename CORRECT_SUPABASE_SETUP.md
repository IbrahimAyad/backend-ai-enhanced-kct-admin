# Correct Supabase Setup - Using Frontend Project

## The Problem
We were using two different Supabase projects:
- Frontend: `https://vkbkzkuvdtuftvewnnue.supabase.co` (working)
- Admin Backend: `https://gvcswimqaxvylgxbklbz.supabase.co` (wrong)

## Solution: Use Same Project for Both

### 1. Update Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://vkbkzkuvdtuftvewnnue.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYmt6a3V2ZHR1ZnR2ZXdubnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Mzg2NTgsImV4cCI6MjA1MDExNDY1OH0.i7NR36P26ReHtmru4jqLspwKuKoDQJF1HN51KqfmUYs
```

### 2. Set Up Admin User in Frontend Database
Go to: https://app.supabase.com/project/vkbkzkuvdtuftvewnnue/sql/new

Run this SQL:

```sql
-- Create admin_users table if it doesn't exist
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

-- Create RLS policies for admin_users
CREATE POLICY "Admin users can view all admin records" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND (permissions @> ARRAY['all']::text[] OR role = 'super_admin')
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

-- Add the admin user (assuming support@kctmenswear.com exists in auth.users)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'support@kctmenswear.com'
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Insert or update admin user
        INSERT INTO admin_users (user_id, role, permissions, is_active)
        VALUES (v_user_id, 'super_admin', ARRAY['all'], true)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            permissions = ARRAY['all'],
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user created/updated for support@kctmenswear.com';
    ELSE
        RAISE NOTICE 'User support@kctmenswear.com not found. Please sign up first.';
    END IF;
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
```

### 3. After Updates
1. Wait for Vercel deployment to complete
2. Test at: https://backend-ai-enhanced-kct-admin.vercel.app/login
3. Use credentials: support@kctmenswear.com / 127598

If the user doesn't exist, sign up first at your frontend app, then run the SQL to make them admin.