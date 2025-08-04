// Create Admin User Directly
// Run this locally with: npx tsx create-admin-directly.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@kctmenswear.com',
      password: 'Admin123!@#', // Change this password!
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    console.log('✅ User created:', authData.user?.email);

    // 2. Create admin record
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user!.id,
        role: 'super_admin',
        permissions: ['all'],
        is_active: true
      });

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      return;
    }

    console.log('✅ Admin record created!');
    console.log('\n🎉 Admin user setup complete!');
    console.log('Email: admin@kctmenswear.com');
    console.log('Password: Admin123!@# (please change this!)');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();