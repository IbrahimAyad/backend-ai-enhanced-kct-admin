# Deployment Authentication Fix

## Problem Analysis

The issue where "main Vercel URL has authentication problems but preview URLs work" suggests environment variable or configuration differences between deployment environments.

## Root Causes & Solutions

### 1. Environment Variable Inconsistencies

**Problem**: Different environment variables between main deployment and preview deployments.

**Solution**: Verify and fix environment variables in Vercel dashboard.

#### Check Environment Variables:
```bash
# In Vercel dashboard, verify these are set for ALL environments:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=https://your-main-domain.vercel.app
```

#### Vercel CLI Commands:
```bash
# List all environment variables
vercel env ls

# Add missing environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Pull environment variables to local
vercel env pull .env.local
```

### 2. OAuth Redirect URL Configuration

**Problem**: Supabase OAuth redirect URLs may not include all deployment URLs.

**Solution**: Update Supabase Auth configuration.

#### In Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL**: Add your main domain
   ```
   https://your-main-domain.vercel.app
   ```

2. **Redirect URLs**: Add all possible URLs
   ```
   https://your-main-domain.vercel.app/auth/callback
   https://your-main-domain.vercel.app/**
   https://*.vercel.app/auth/callback
   https://*.vercel.app/**
   ```

3. **Additional Redirect URLs** (for all preview deployments):
   ```
   https://backend-ai-enhanced-kct-admin-*.vercel.app/**
   ```

### 3. Build and Routing Differences

**Problem**: Different build artifacts or routing between main and preview deployments.

**Solution**: Ensure consistent build configuration.

#### Update `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install --legacy-peer-deps",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite-supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@vite-supabase-anon-key",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@vite-stripe-publishable-key"
  }
}
```

### 4. Domain-Specific Authentication Logic

**Problem**: Authentication logic might behave differently based on the domain.

**Solution**: Add domain-aware authentication handling.

#### Enhanced Authentication Check:
```typescript
// src/utils/authUtils.ts
export const getAuthConfig = () => {
  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'your-main-domain.vercel.app';
  const isPreviewDomain = hostname.includes('-') && hostname.includes('vercel.app');
  
  return {
    isMainDomain,
    isPreviewDomain,
    redirectUrl: `${window.location.origin}/auth/callback`,
    // Add any domain-specific configuration
    debugMode: isPreviewDomain, // Enable debug mode on preview URLs
  };
};

// Enhanced OAuth configuration
export const getOAuthConfig = () => {
  const { redirectUrl, debugMode } = getAuthConfig();
  
  return {
    redirectTo: redirectUrl,
    ...(debugMode && { queryParams: { debug: 'true' } }),
  };
};
```

### 5. Session Storage and Cookies

**Problem**: Different cookie/session behavior between domains.

**Solution**: Ensure consistent session handling.

#### Add Session Debug to App:
```typescript
// src/components/SessionDebug.tsx (for development)
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SessionDebug() {
  useEffect(() => {
    if (import.meta.env.DEV || window.location.search.includes('debug=true')) {
      const checkSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        console.log('Session Debug:', {
          domain: window.location.hostname,
          hasSession: !!data.session,
          error: error?.message,
          user: data.session?.user?.email,
          expiresAt: data.session?.expires_at,
        });
      };
      
      checkSession();
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth State Change:', {
            event,
            domain: window.location.hostname,
            hasSession: !!session,
            user: session?.user?.email,
          });
        }
      );
      
      return () => subscription.unsubscribe();
    }
  }, []);
  
  return null;
}
```

## Immediate Fix Steps

### Step 1: Environment Variable Audit (5 minutes)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all required variables are set for **Production**, **Preview**, and **Development**
3. Ensure no trailing spaces or hidden characters
4. Redeploy after any changes

### Step 2: Supabase OAuth Configuration (5 minutes)
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your main domain to Site URL
3. Add wildcard patterns for all Vercel deployments to Redirect URLs
4. Save configuration

### Step 3: Test Authentication Flow (10 minutes)
1. Clear browser cache and cookies
2. Test login on main URL
3. Test login on latest preview URL
4. Check browser console for any errors
5. Verify session persistence across page refreshes

### Step 4: Emergency Rollback Plan
If main URL still doesn't work:
1. Create a CNAME record pointing main domain to a working preview URL
2. Use preview URLs as primary access method temporarily
3. Investigate main domain-specific issues

## Long-term Monitoring

### Set up monitoring for:
- Authentication success/failure rates by domain
- Session persistence issues
- Environment variable changes
- Deployment-specific errors

### Create alerts for:
- High authentication failure rates
- Missing environment variables
- OAuth configuration changes

## Testing Checklist

After implementing fixes:
- [ ] Main URL authentication works
- [ ] Preview URL authentication works
- [ ] Session persists across page refreshes
- [ ] OAuth redirect URLs work correctly
- [ ] Environment variables are consistent
- [ ] No JavaScript errors in console
- [ ] Admin dashboard loads after login
- [ ] Logout works correctly
- [ ] Authentication works in incognito/private mode

This should resolve the deployment-specific authentication issues and ensure consistent behavior across all Vercel deployment URLs.