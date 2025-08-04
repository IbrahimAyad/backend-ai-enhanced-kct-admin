# Admin Authentication Testing Guide

## Prerequisites

1. **Ensure you have the service role key in your .env file**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   Get this from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

2. **Install dependencies**:
   ```bash
   npm install
   npm install -D tsx dotenv
   ```

## Step 1: Create a Test Admin User

### 1.1 First, create a regular user account

Start your development server:
```bash
npm run dev
```

1. Go to http://localhost:5173
2. Click "Sign In" 
3. Click "Sign Up" and create a new account with:
   - Email: `admin@test.com` (or your email)
   - Password: `TestAdmin123!`
4. Complete the registration

### 1.2 Grant admin access to the user

Run the setup script:
```bash
npx tsx scripts/setup-admin.ts admin@test.com
```

You should see output like:
```
🔍 Looking for user with email: admin@test.com
✅ Found user with ID: abc123...
✅ Admin user created successfully!
📋 Admin details:
  id: xyz789...
  user_id: abc123...
  role: super_admin
  permissions: ['all']

🎉 Setup complete! The user can now access the admin dashboard.
```

## Step 2: Test Admin Access

### 2.1 Test accessing the admin dashboard

1. Sign in with your admin account at http://localhost:5173
2. Navigate to http://localhost:5173/admin
3. You should see the admin dashboard with full access

### 2.2 Verify admin features work

Check that you can:
- ✅ View all orders (not just your own)
- ✅ View all customers
- ✅ Edit products
- ✅ Access analytics
- ✅ Manage inventory

## Step 3: Test Non-Admin User Blocking

### 3.1 Create a regular user account

1. Sign out of the admin account
2. Create a new account with:
   - Email: `user@test.com`
   - Password: `TestUser123!`

### 3.2 Test access denial

1. Try to navigate to http://localhost:5173/admin
2. You should see: "Access Denied - You don't have permission to access the admin dashboard"
3. The user should be redirected or shown an error page

## Step 4: Test Database-Level Security

Run these SQL queries in Supabase SQL editor to verify RLS is working:

```sql
-- First, check as admin user
-- Replace 'your-admin-user-id' with the actual ID from Step 1
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'your-admin-user-id';

-- Admin should see all customers
SELECT COUNT(*) as customer_count FROM customers;

-- Admin should see all orders
SELECT COUNT(*) as order_count FROM orders;

-- Now check as regular user
-- Replace 'your-regular-user-id' with the actual ID from Step 3
SET LOCAL request.jwt.claim.sub TO 'your-regular-user-id';

-- Regular user should only see their own customer record (1 or 0)
SELECT COUNT(*) as customer_count FROM customers;

-- Regular user should only see their own orders
SELECT COUNT(*) as order_count FROM orders;
```

## Step 5: Verify Component-Level Protection

### 5.1 Check React component protection

The admin dashboard should be using the `useAdminAuth` hook:

```typescript
// This should be in AdminDashboard.tsx
const { isAdmin, adminUser, loading } = useAdminAuth();

if (loading) {
  return <LoadingSpinner />;
}

if (!isAdmin) {
  return <AccessDenied />;
}
```

### 5.2 Test admin-only features

Try these actions as both admin and regular user:

| Feature | Admin Result | User Result |
|---------|--------------|-------------|
| View /admin | ✅ Full access | ❌ Access denied |
| Edit products | ✅ Can edit | ❌ No edit button |
| View all orders | ✅ Sees all | ❌ Sees only own |
| Access analytics | ✅ Full data | ❌ No access |

## Troubleshooting

### "User not found" error
- Make sure the user completed signup before running the script
- Check that the email matches exactly (case-sensitive)

### "Access denied" as admin
- Clear browser cache and cookies
- Check the admin_users table:
  ```sql
  SELECT * FROM admin_users WHERE user_id = 'your-user-id';
  ```
- Ensure `is_active = true`

### Hook returns isAdmin = false
- Check browser console for errors
- Verify the admin_users table has your record
- Try hard refresh (Ctrl+Shift+R)

## Quick SQL Checks

```sql
-- Check if user is admin
SELECT 
    au.*,
    u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'admin@test.com';

-- Check all admin users
SELECT 
    au.*,
    u.email,
    u.last_sign_in_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- Test RLS policy for admin
SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = 'your-user-id'
    AND is_active = true
) as is_admin;
```

## Next Steps

Once admin authentication is verified:
1. ✅ Admin users can access dashboard
2. ✅ Regular users are blocked
3. ✅ RLS policies work correctly

You're ready to move on to Week 2: Email Verification System!