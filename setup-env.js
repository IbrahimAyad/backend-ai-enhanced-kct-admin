#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnv() {
  console.log('\n🚀 KCT Menswear Environment Setup\n');
  console.log('This script will help you set up your .env file with actual values.\n');
  
  console.log('📝 You\'ll need the following from your Supabase project:');
  console.log('   1. Project URL (e.g., https://abcdefghijklmnop.supabase.co)');
  console.log('   2. Anon/Public Key (starts with eyJ...)');
  console.log('   3. Service Role Key (starts with eyJ...)');
  console.log('\n   Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api\n');

  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const supabaseAnonKey = await question('Enter your Supabase Anon Key: ');
  const supabaseServiceKey = await question('Enter your Supabase Service Role Key: ');
  
  console.log('\n📝 For Stripe (optional, press Enter to skip):');
  const stripePublishableKey = await question('Enter your Stripe Publishable Key (or press Enter to skip): ') || 'pk_test_your-stripe-publishable-key-here';

  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Stripe Configuration (Public)
VITE_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}

# Application URLs
VITE_APP_URL=http://localhost:8080

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_RECOMMENDATIONS=true

# Admin Setup (Server-side only - DO NOT expose in frontend)
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# IMPORTANT: Add these values to your production environment:
# - Get Supabase values from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
# - Get Stripe values from: https://dashboard.stripe.com/apikeys
# - For production, use your actual domain for VITE_APP_URL
`;

  // Backup existing .env if it exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(envPath, `${envPath}.backup-${timestamp}`);
    console.log(`\n📦 Backed up existing .env to .env.backup-${timestamp}`);
  }

  // Write new .env
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. The app should now connect to Supabase properly');
  console.log('3. Create a user account and set up admin access');
  
  rl.close();
}

setupEnv().catch(console.error);