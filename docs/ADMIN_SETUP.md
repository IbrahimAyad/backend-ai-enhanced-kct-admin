# Admin Setup Guide

## Overview
The KCT Menswear admin system now uses a secure role-based access control (RBAC) system. This guide explains how to set up admin users and manage permissions.

## Initial Setup

### 1. Run the Database Migration
First, create the admin_users table by running the migration:

```sql
-- Copy and run the contents of:
-- supabase/migrations/001_create_admin_users.sql
```

### 2. Create Your First Admin Account
1. Sign up through the normal registration flow at `/`
2. Note the email address you used

### 3. Grant Admin Access
After creating your account, run the setup script:

```bash
# Install dependencies if not already done
npm install

# Add tsx if needed
npm install -D tsx dotenv

# Run the admin setup script
npx tsx scripts/setup-admin.ts your-email@example.com
```

### 4. Add Service Role Key to .env
For the script to work, add your service role key to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **IMPORTANT**: Never expose the service role key in frontend code!

## Admin Roles

### Super Admin
- Can manage all admin users
- Has access to all features
- Can grant/revoke admin access
- Permissions: `['all']`

### Admin
- Full access to business operations
- Cannot manage other admins
- Permissions: Customizable array

### Manager
- Limited access to specific areas
- Read-only access to sensitive data
- Permissions: Customizable array

## Managing Admin Users

### Adding a New Admin (SQL)
```sql
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
  'user-auth-id-here',
  'admin', -- or 'manager'
  ARRAY['orders', 'products', 'customers']
);
```

### Deactivating an Admin
```sql
UPDATE public.admin_users 
SET is_active = false 
WHERE user_id = 'user-auth-id-here';
```

### Checking Permissions in Code
```typescript
// In your React components
const { hasPermission } = useAdminAuth();

if (hasPermission('orders')) {
  // Show orders management
}

// Require specific permission
const { requirePermission } = useAdminAuth();
requirePermission('products'); // Redirects if no permission
```

## Security Features

### Row Level Security (RLS)
- Only super_admins can view all admin records
- Admin users can only view their own record
- All modifications require super_admin role

### Authentication Flow
1. User logs in normally
2. `useAdminAuth` hook checks admin_users table
3. Non-admin users are redirected
4. Admin status is verified on each request

### Protected Routes
All `/admin/*` routes are protected by:
1. Client-side auth check (immediate feedback)
2. Server-side RLS policies (actual security)
3. API-level permission checks

## Common Issues

### "Access Denied" after setup
1. Check if the admin_users record was created
2. Verify `is_active = true`
3. Clear browser cache and cookies
4. Check browser console for errors

### Script fails with "User not found"
1. Ensure user has completed signup
2. Check the customers table has the user
3. Verify email address is correct

### Cannot access certain features
1. Check your permissions array
2. Super_admin role has access to everything
3. Other roles need specific permissions

## Best Practices

1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Regular Audits**: Review admin users quarterly
3. **Secure Storage**: Never commit service role keys
4. **Activity Logging**: Monitor admin actions (coming soon)
5. **2FA**: Enable two-factor authentication (coming soon)

## Permission Reference

Available permissions:
- `all` - Super admin only
- `orders` - Order management
- `products` - Product catalog
- `customers` - Customer data
- `inventory` - Stock management
- `analytics` - Reports and analytics
- `marketing` - Email campaigns
- `settings` - System configuration

## Emergency Procedures

### Revoke All Admin Access
```sql
UPDATE public.admin_users SET is_active = false;
```

### Grant Emergency Access
```sql
-- Use Supabase dashboard SQL editor with service role
INSERT INTO public.admin_users (user_id, role, permissions, is_active)
VALUES ('your-auth-id', 'super_admin', ARRAY['all'], true);
```

### Reset Admin System
1. Disable all admin users
2. Re-run migration
3. Set up new super admin
4. Re-grant necessary permissions

## Monitoring

Check admin activity:
```sql
SELECT 
  au.*, 
  u.email,
  u.last_sign_in_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY u.last_sign_in_at DESC;
```

## Future Enhancements

- [ ] Audit trail for all admin actions
- [ ] Two-factor authentication
- [ ] IP whitelist for admin access
- [ ] Temporary admin access tokens
- [ ] Admin session timeout
- [ ] Email alerts for admin changes