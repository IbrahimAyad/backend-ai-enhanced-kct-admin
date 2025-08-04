# Authentication Recovery Strategy

## CRITICAL ISSUE ANALYSIS

Based on the codebase analysis, we have identified a **circular dependency problem** in the RLS (Row Level Security) policies that creates a chicken-and-egg authentication crisis:

### The Root Problem
1. **Admin users cannot log in** because the `admin_users` table has RLS policies that require an existing admin to authenticate
2. **Circular dependency**: Policies require `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())` to access admin records
3. **Bootstrap failure**: No way to create the first admin user without already being an admin

---

## 1. IMMEDIATE EMERGENCY FIXES (Next 24-48 Hours)

### STEP 1A: Emergency RLS Policy Fix (URGENT - 15 minutes)

Run this SQL immediately in your Supabase SQL Editor to break the circular dependency:

```sql
-- EMERGENCY: Fix circular dependency in admin_users RLS policies
-- This allows any authenticated user to check if they are an admin

-- Drop ALL existing policies on admin_users table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- Create non-circular SELECT policy
-- This allows ANY authenticated user to check admin status (essential for auth flow)
CREATE POLICY "authenticated_users_can_check_admin_status" ON public.admin_users
    FOR SELECT 
    USING (true);  -- Allow all authenticated users to read admin table

-- Restrict write operations to service role only (for safety)
CREATE POLICY "service_role_manages_admins" ON public.admin_users
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify the fix worked
SELECT 'EMERGENCY FIX: Policies updated successfully' as status;
```

### STEP 1B: Bootstrap First Admin User (URGENT - 5 minutes)

```sql
-- Create the first admin user account
-- Replace the email and password with your desired admin credentials

DO $$
DECLARE
    new_user_id UUID;
    admin_email TEXT := 'admin@kctmenswear.com'; -- CHANGE THIS
    admin_password TEXT := 'SecureAdminPass123!'; -- CHANGE THIS
BEGIN
    -- Insert into auth.users table directly
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
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt(admin_password, gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO new_user_id;

    -- Get user ID if conflict occurred
    IF new_user_id IS NULL THEN
        SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email;
    END IF;

    -- Insert into admin_users table
    INSERT INTO public.admin_users (
        user_id,
        role,
        permissions,
        is_active
    ) VALUES (
        new_user_id,
        'super_admin',
        ARRAY['all'],
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_admin',
        permissions = ARRAY['all'],
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'SUCCESS: Admin user created/updated with email: % and ID: %', admin_email, new_user_id;
END $$;
```

### STEP 1C: Emergency Rollback Script (If Needed)

If the above fixes cause issues, run this to rollback:

```sql
-- EMERGENCY ROLLBACK: Disable RLS temporarily
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Re-enable with minimal policy
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "temp_admin_access" ON public.admin_users FOR ALL USING (true);

-- Check admin users exist
SELECT * FROM public.admin_users;
```

---

## 2. AUTHENTICATION SYSTEM REDESIGN

### Problem: Current Circular RLS Dependencies

The current RLS policies create these circular dependencies:
- Admin policies require checking `admin_users` table
- But accessing `admin_users` requires being an admin
- Authentication flow breaks because `useAdminAuth` hook fails

### Solution: Tiered Authentication Architecture

#### Phase 1: Immediate Fix (Non-Circular RLS)
```sql
-- Safe RLS policies that don't create circular dependencies

-- 1. Allow all authenticated users to check admin status
CREATE POLICY "auth_users_read_admin_status" ON public.admin_users
    FOR SELECT 
    USING (true);

-- 2. Restrict admin management to specific functions
CREATE POLICY "secure_admin_management" ON public.admin_users
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'service_role');
```

#### Phase 2: Secure Admin Functions (Server-Side)
Create Supabase Edge Functions for admin operations:

```typescript
// supabase/functions/admin-management/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify requester is super admin
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .eq('is_active', true)
    .single()

  if (adminCheck?.role !== 'super_admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  // Handle admin operations securely
  // ...
})
```

---

## 3. DEPLOYMENT AUTHENTICATION ISSUES

### Issue: Main URL vs Preview URL Differences

The `VERCEL_LOGIN_ISSUE.md` indicates authentication works on preview URLs but not main URL.

#### Root Causes:
1. **Environment Variables**: Different env vars between main and preview deployments
2. **OAuth Redirect URLs**: Mismatched redirect configurations
3. **Build/Routing Issues**: Different build artifacts

#### Debug Script:
```typescript
// src/utils/deploymentDebug.ts
export const debugAuthentication = () => {
  console.log('=== AUTHENTICATION DEBUG ===');
  console.log('Current URL:', window.location.href);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Key (first 10 chars):', 
    import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));
  
  // Test Supabase connection
  import('@/lib/supabase').then(({ supabase }) => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Session check:', { hasSession: !!data.session, error });
    });
  });
};

// Call this on app load
if (typeof window !== 'undefined') {
  debugAuthentication();
}
```

#### Environment Validation Script:
```sql
-- Validate Supabase configuration
SELECT 
    current_setting('app.settings.jwt_secret') as jwt_secret_set,
    current_setting('app.settings.jwt_exp') as jwt_expiry;

-- Check OAuth providers
SELECT * FROM auth.providers WHERE enabled = true;

-- Verify redirect URLs
SELECT * FROM auth.config;
```

---

## 4. LONG-TERM AUTHENTICATION ARCHITECTURE

### Scalable Admin Management System

#### A. Role-Based Access Control (RBAC)
```sql
-- Enhanced admin roles with granular permissions
CREATE TYPE admin_role_type AS ENUM (
    'super_admin',    -- Full system access
    'admin',          -- Most admin functions
    'manager',        -- Limited admin functions
    'moderator',      -- Content moderation only
    'viewer'          -- Read-only admin access
);

-- Permission categories
CREATE TYPE permission_category AS ENUM (
    'users',          -- User management
    'products',       -- Product management  
    'orders',         -- Order management
    'analytics',      -- Analytics access
    'settings',       -- System settings
    'content',        -- Content management
    'reports'         -- Report generation
);
```

#### B. Secure Admin Authentication Flow
```typescript
// Enhanced useAdminAuth hook with better error handling
export function useAdminAuth() {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAdminData(null);
      setLoading(false);
      return;
    }

    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Non-circular query - safe to call
      const { data, error: queryError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle to avoid errors when no record

      if (queryError) {
        console.error('Admin status check failed:', queryError);
        setError(queryError.message);
        setAdminData(null);
      } else {
        setAdminData(data);
      }
    } catch (err) {
      console.error('Admin auth error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAdminData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin: !!adminData,
    adminUser: adminData,
    loading,
    error,
    checkAdminStatus,
    hasPermission: (permission: string) => {
      if (!adminData) return false;
      if (adminData.role === 'super_admin') return true;
      return adminData.permissions.includes(permission);
    }
  };
}
```

#### C. Security Best Practices

1. **Multi-Factor Authentication (MFA)**
   - Require MFA for all admin accounts
   - Use time-based OTP (TOTP) or hardware keys

2. **Session Management**
   - Short session timeouts for admins
   - Activity-based session refresh
   - Concurrent session limits

3. **Audit Logging**
   - Log all admin actions
   - IP address tracking
   - Suspicious activity detection

4. **Principle of Least Privilege**
   - Granular permissions
   - Time-limited elevated access
   - Regular permission audits

---

## IMMEDIATE ACTION PLAN

### Priority 1 (Next 2 Hours):
1. ✅ Run STEP 1A (Emergency RLS Fix)
2. ✅ Run STEP 1B (Bootstrap Admin User)
3. ✅ Test admin login on both main and preview URLs
4. ✅ Document which URLs work

### Priority 2 (Next 24 Hours):
1. ✅ Implement environment debug script
2. ✅ Fix OAuth redirect URL configuration
3. ✅ Update Vercel environment variables
4. ✅ Test authentication flow end-to-end

### Priority 3 (Next Week):
1. ✅ Implement new authentication architecture
2. ✅ Add proper error handling and logging
3. ✅ Set up monitoring and alerts
4. ✅ Conduct security audit

---

## TESTING CHECKLIST

After implementing fixes, verify:

- [ ] Admin user can log in on main URL
- [ ] Admin user can log in on preview URLs  
- [ ] Admin dashboard loads correctly
- [ ] Admin permissions work as expected
- [ ] RLS policies don't block legitimate access
- [ ] Error messages are helpful and not cryptic
- [ ] Session persistence works correctly
- [ ] OAuth flows work on all deployment URLs

---

## MONITORING AND MAINTENANCE

Set up ongoing monitoring for:
- Authentication failure rates
- Admin login attempts and failures
- RLS policy performance
- Session timeout incidents
- Deployment-specific authentication issues

This comprehensive strategy addresses both immediate crisis resolution and long-term system stability.