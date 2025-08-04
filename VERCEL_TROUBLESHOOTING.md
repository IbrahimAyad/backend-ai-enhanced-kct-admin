# Vercel Deployment Troubleshooting

## Current Issue
Getting "Missing public directory" error despite having correct vercel.json configuration.

## Immediate Solution
The issue might be that Vercel is not recognizing our project as a Vite project or the build is failing silently.

## Steps to Fix:

### 1. Check Vercel Project Settings
In Vercel Dashboard → Project Settings → Build & Development Settings:

- **Framework Preset**: Should be "Vite" or "Other"
- **Build Command**: Should be `npm run build`  
- **Output Directory**: Should be `dist`
- **Install Command**: Should be `npm install --legacy-peer-deps`

### 2. Override Settings if Needed
If the auto-detection failed, manually set:
- Framework Preset: "Other"
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. Alternative: Delete and Recreate Project
If settings don't help:
1. Delete the current Vercel project
2. Import the GitHub repository again
3. Select "Vite" as framework during setup
4. Add environment variables immediately after import

### 4. Manual Build Check
Our local build works fine (we tested it), so the issue is Vercel-specific.

## Environment Variables Needed
Once the project deploys successfully, ensure these are set:

```
VITE_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4NzE3NDUsImV4cCI6MjAzNTQ0Nzc0NX0.0e0Qi_ZbOgxTFIiEpBvhHnG7m0RcSfLfh8sq75C-5jI
```

## Test After Deploy
1. Visit: https://your-app.vercel.app/debug-env.html
2. Check environment variables are correct
3. Test login: https://your-app.vercel.app/login
4. Use: support@kctmenswear.com / 127598

## Quick Fix Commands
If you want to try a different approach locally:

```bash
# Test build with verbose output
npm run build --verbose

# Check if dist folder is created correctly
ls -la dist/

# Verify all files are in dist
find dist -type f
```