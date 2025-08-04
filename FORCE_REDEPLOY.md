# Force Fresh Deployment

## The Issue
Even after updating environment variables, Vercel may be using cached values. The 401 "Invalid API key" error persists.

## Solutions to Try (in order):

### 1. Clear Vercel Build Cache
In Vercel Dashboard:
1. Go to Settings → General
2. Scroll to "Build & Development Settings"
3. Clear build cache

### 2. Force Redeploy with Environment Variables
1. Go to Vercel Dashboard → Deployments
2. Click the three dots on latest deployment
3. Select "Redeploy"
4. Check "Use existing Build Cache" = OFF

### 3. Check Environment Variables Are Applied
Visit: https://backend-ai-enhanced-kct-admin.vercel.app/debug-env.html

This will show what environment variables the deployed app actually sees.

### 4. Manual Environment Variable Check
In Vercel Dashboard → Settings → Environment Variables:

**Required variables:**
- `VITE_SUPABASE_URL` = `https://gvcswimqaxvylgxbklbz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzE3NDUsImV4cCI6MjAzNTQ0Nzc0NX0.0e0Qi_ZbOgxTFIiEpBvhHnG7m0RcSfLfh8sq75C-5jI`

Make sure both are set for ALL environments (Production, Preview, Development).

### 5. If Still Failing - New Deployment
Create a completely fresh deployment:
1. Delete current deployment
2. Reconnect GitHub repository
3. Set environment variables again
4. Deploy fresh

## Quick Test
After any changes, test at:
- https://backend-ai-enhanced-kct-admin.vercel.app/debug-env.html
- https://backend-ai-enhanced-kct-admin.vercel.app/test

If debug-env.html shows the correct values but test still fails, then it's a different issue.
If debug-env.html shows wrong/missing values, the environment variables aren't being applied.