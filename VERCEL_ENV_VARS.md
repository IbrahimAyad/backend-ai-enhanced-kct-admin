# Vercel Environment Variables - COPY EXACTLY

## Required Environment Variables for Vercel

Copy and paste these EXACTLY into your Vercel project settings:

### 1. VITE_SUPABASE_URL
```
https://gvcswimqaxvylgxbklbz.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzE3NDUsImV4cCI6MjAzNTQ0Nzc0NX0.0e0Qi_ZbOgxTFIiEpBvhHnG7m0RcSfLfh8sq75C-5jI
```

## Steps to Update in Vercel:

1. Go to https://vercel.com/dashboard
2. Click on your project: `backend-ai-enhanced-kct-admin`
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. For each variable:
   - Add or update the variable name (e.g., `VITE_SUPABASE_URL`)
   - Paste the value from above
   - Select all environments (Production, Preview, Development)
   - Click "Save"
6. After adding both variables, redeploy your project:
   - Go to "Deployments" tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

## Important Notes:

- These are the CORRECT values that work (verified in test-supabase.html)
- The anon key in your current .env was wrong - it's now been fixed locally
- Make sure there are no extra spaces or line breaks when copying
- Both variables MUST start with `VITE_` for Vite to expose them to the frontend

## Test After Deployment:

Visit: https://backend-ai-enhanced-kct-admin.vercel.app/test

Test login:
- Email: `support@kctmenswear.com`
- Password: `127598`