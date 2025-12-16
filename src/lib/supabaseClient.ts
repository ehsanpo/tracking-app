import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Note: For Expo, load env variables into process.env using your preferred method.
// In local development you can copy .env.example -> .env and use a dotenv tool when running scripts.

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not set. Copy .env.example to .env and fill keys.');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Add options suitable for React Native if needed (eg. global fetch polyfill)
});

export default supabase;
