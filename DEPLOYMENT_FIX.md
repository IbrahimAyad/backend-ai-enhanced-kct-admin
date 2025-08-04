# Authentication Fix for Deployed Admin Dashboard

## The Issue
The authentication is failing on the deployed admin dashboard because:
1. The anon key in .env doesn't match the one in test-supabase.html
2. Supabase URL configuration is empty in the dashboard
3. Environment variables may not be properly set on Vercel

## Correct Supabase Credentials

### Supabase URL
```
https://gvcswimqaxvylgxbklbz.supabase.co
```

### Anon Key (Public - Safe for frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzE3NDUsImV4cCI6MjAzNTQ0Nzc0NX0.0e0Qi_ZbOgxTFIiEpBvhHnG7m0RcSfLfh8sq75C-5jI
```

### Service Role Key (Secret - Never expose in frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTg3MTc0NSwiZXhwIjoyMDM1NDQ3NzQ1fQ.dT4yoJFZXo01R0ntM10O0JshGlXIUrKoYaKAoQ9LTDY
```

## Steps to Fix

### 1. Update Local .env File
The .env file currently has the wrong anon key. Update it with the correct one shown above.

### 2. Update Vercel Environment Variables
In Vercel dashboard (https://vercel.com/dashboard), go to your project settings and update:

```
VITE_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzE3NDUsImV4cCI6MjAzNTQ0Nzc0NX0.0e0Qi_ZbOgxTFIiEpBvhHnG7m0RcSfLfh8sq75C-5jI
```

### 3. Update Supabase Dashboard Settings
In Supabase dashboard (https://app.supabase.com/project/gvcswimqaxvylgxbklbz/auth/url-configuration):

Add these URLs:
- Site URL: `https://backend-ai-enhanced-kct-admin.vercel.app`
- Redirect URLs:
  - `https://backend-ai-enhanced-kct-admin.vercel.app/*`
  - `https://backend-ai-enhanced-kct-admin-609oz8qdd-ibrahimayads-projects.vercel.app/*`
  - `http://localhost:8080/*`
  - `http://localhost:5173/*`

### 4. Test Credentials
Use the test account:
- Email: `support@kctmenswear.com`
- Password: `127598`

### 5. Redeploy on Vercel
After updating the environment variables, trigger a new deployment on Vercel to pick up the changes.

## Quick Test URLs
- Production: https://backend-ai-enhanced-kct-admin.vercel.app/test
- Local: http://localhost:8080/test

## Troubleshooting
If authentication still fails:
1. Check browser console for errors
2. Verify environment variables are loaded correctly
3. Ensure Supabase project is active and not paused
4. Check that the user exists in Supabase Auth