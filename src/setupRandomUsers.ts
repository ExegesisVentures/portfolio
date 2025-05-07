import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure this script is run in a secure environment, not client-side
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables. Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Function to generate random string
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to create random users
async function setupRandomUsers() {
  const numberOfUsers = 5; // Adjust as needed

  for (let i = 0; i < numberOfUsers; i++) {
    const email = `user_${generateRandomString(8)}@example.com`;
    const password = generateRandomString(10);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (error) {
        console.error(`Error creating user ${email}:`, error.message);
        continue;
      }

      console.log(`User created successfully: ${email} with password: ${password}`, data.user);
    } catch (err) {
      console.error(`Unexpected error creating user ${email}:`, err);
    }
  }
}

setupRandomUsers(); 