import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client once and reuse it
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
); 