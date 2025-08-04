#!/usr/bin/env node

/**
 * Setup script to create the first admin user
 * Run this after creating your admin account through the normal signup flow
 * 
 * Usage: npx tsx scripts/setup-admin.ts <email>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin(email: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);

    // First, get the user by email
    const { data: users, error: userError } = await supabase
      .from('customers')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (userError || !users?.auth_user_id) {
      console.error('❌ User not found. Make sure the user has signed up first.');
      return;
    }

    const userId = users.auth_user_id;
    console.log(`✅ Found user with ID: ${userId}`);

    // Check if already an admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('⚠️  User is already an admin:', existingAdmin);
      return;
    }

    // Create admin user
    const { data: newAdmin, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        role: 'super_admin',
        permissions: ['all'],
        is_active: true
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin details:', {
      id: newAdmin.id,
      user_id: newAdmin.user_id,
      role: newAdmin.role,
      permissions: newAdmin.permissions
    });

    console.log('\n🎉 Setup complete! The user can now access the admin dashboard.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: npx tsx scripts/setup-admin.ts <email>');
  process.exit(1);
}

// Run the setup
setupAdmin(email);