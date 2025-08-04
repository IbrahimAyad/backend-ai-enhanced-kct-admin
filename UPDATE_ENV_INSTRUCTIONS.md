# Quick Environment Setup

## Step 1: Get your Supabase credentials

1. Go to https://app.supabase.com
2. Select your project (or create one)
3. Navigate to: Settings → API
4. You'll see:
   - **Project URL**: Something like `https://abcdefghijklmnop.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
   - **service_role key**: Another long string starting with `eyJ...`

## Step 2: Update your .env file

Replace the placeholder values in your `.env` file:

```env
# Replace this:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# With your actual values:
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...YOUR_ACTUAL_ANON_KEY...
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR_ACTUAL_SERVICE_KEY...
```

## Step 3: Restart the server

After updating the .env file:

1. Stop the current server (Ctrl+C)
2. Start it again: `npm run dev`
3. Go to http://localhost:8080

The app should now connect to Supabase properly!

## Need a new Supabase project?

If you don't have a Supabase project yet:

1. Go to https://app.supabase.com
2. Click "New project"
3. Fill in:
   - Project name: "kct-menswear" (or any name)
   - Database password: (save this somewhere safe)
   - Region: Choose closest to you
4. Click "Create project"
5. Wait for it to provision (~1 minute)
6. Then get your credentials from Settings → API