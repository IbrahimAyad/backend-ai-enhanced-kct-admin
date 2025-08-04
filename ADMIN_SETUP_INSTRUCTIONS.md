# Admin Setup Instructions

## The Problem
The user `support@kctmenswear.com` is NOT set up as an admin in the database. This is why you're getting 401 errors - the user exists but doesn't have admin privileges.

## Solution: Run this SQL in Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com/project/gvcswimqaxvylgxbklbz/sql/new
2. Copy and paste this SQL:

```sql
-- Get the user ID for support@kctmenswear.com
WITH user_info AS (
  SELECT id 
  FROM auth.users 
  WHERE email = 'support@kctmenswear.com'
  LIMIT 1
)
-- Insert into admin_users table
INSERT INTO admin_users (user_id, role, permissions, is_active)
SELECT 
  id as user_id,
  'super_admin' as role,
  ARRAY['all'] as permissions,
  true as is_active
FROM user_info
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = (SELECT id FROM user_info)
);

-- If the user already exists as admin, update to ensure super_admin
UPDATE admin_users 
SET 
  role = 'super_admin',
  permissions = ARRAY['all'],
  is_active = true,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'support@kctmenswear.com'
);

-- Verify the result
SELECT 
  au.*,
  u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'support@kctmenswear.com';
```

3. Click "Run" to execute the SQL

## What This Does
- Finds the user ID for support@kctmenswear.com
- Creates an admin_users record with super_admin role
- Grants all permissions
- If the record already exists, updates it to ensure super_admin status

## After Running the SQL
1. Clear your browser cache
2. Visit https://backend-ai-enhanced-kct-admin.vercel.app/login
3. Log in with:
   - Email: support@kctmenswear.com
   - Password: 127598

## Alternative: Use a Different Admin Email
If support@kctmenswear.com wasn't properly created, you can:
1. Sign up with a new email through the normal flow
2. Run the same SQL above but replace 'support@kctmenswear.com' with your new email

## Why This Happened
The system requires explicit admin setup. Just having an email in config files doesn't grant admin access - you must have a record in the admin_users table.