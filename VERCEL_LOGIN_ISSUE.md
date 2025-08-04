# Vercel Login Issue - Important Note

## Problem
The main Vercel URL has an issue where clicking the "Sign In" button doesn't work properly - it gets stuck.

## Workaround
To access the admin dashboard:
1. Go to your Vercel dashboard
2. Click on one of the deployment preview links (not the main URL)
3. The login will work correctly from the deployment preview URLs

## URLs That Work
- Deployment preview URLs: `https://backend-ai-enhanced-kct-admin-[deployment-hash].vercel.app`
- These URLs have the full deployment hash in them

## URL That Has Issues
- Main URL: The primary domain without the deployment hash

## Status
This is a known issue that needs to be investigated. It might be related to:
- Environment variable configuration
- Build settings
- Routing configuration

For now, always use the deployment preview URLs to access the admin dashboard.