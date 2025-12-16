import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

console.log('process.env:', process.env);
// For Expo SDK 49+, only env vars prefixed with EXPO_PUBLIC_ are inlined on web.
// We also fall back to legacy names to ease migration in native builds.
const manifestExtra = (process.env as any)?.APP_MANIFEST?.extra;
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (Constants.expoConfig?.extra as any)?.SUPABASE_URL ||
  manifestExtra?.SUPABASE_URL ||
  process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (Constants.expoConfig?.extra as any)?.SUPABASE_ANON_KEY ||
  manifestExtra?.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    'Supabase env missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (or your environment).'
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Add options suitable for React Native if needed (eg. global fetch polyfill)
});

export default supabase;
