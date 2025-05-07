import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure this script is run in a secure environment, not client-side
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables. Ensure VITE_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Function to update admin user password
async function updateAdminUser() {
  const adminEmail = 'therizelabs@gmail.com';
  const newPassword = '1234565';

  try {
    // List users to find the ID of the admin user by email
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error.message);
      return;
    }

    const adminUser = users.users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.error('Admin user not found with email:', adminEmail);
      // Optionally create the user if not found
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: newPassword,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating admin user:', createError.message);
        return;
      }

      console.log('Admin user created successfully:', data.user);
      return;
    }

    // Update password for existing user
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating admin user password:', updateError.message);
      return;
    }

    console.log('Admin user password updated successfully:', data.user);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateAdminUser(); 