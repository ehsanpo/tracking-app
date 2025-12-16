# Tracking App (Expo)

Minimal scaffold for the Family Tracking App (Expo + React Native + Web).

Getting started (Windows PowerShell):

1. Install expo CLI if you don't have it:

```powershell
npx expo-cli --version
# or
npm install -g expo-cli
```

2. Install dependencies:

```powershell
npm install
```

3. Start the dev server (web/android):

```powershell
# `.env` is loaded automatically by the provided start script
npm run start
# For web
npm run web
# For android (requires Android SDK / emulator)
npm run android
```

 Environment variables:
 Create a `.env` (or secure secrets) with `SUPABASE_URL` and `SUPABASE_ANON_KEY` before wiring Supabase.

 Supabase setup quick start
 1. Create a project on https://app.supabase.com and copy your `SUPABASE_URL` and `anon` key.
 2. Copy `.env.example` to `.env` and fill the two variables.
 3. In the Supabase SQL editor, paste the SQL in `supabase/migrations/001_init.sql` (creates tables and example RLS policies). Review policies and adjust to your needs.
 4. In local dev, load `.env` into `process.env` when starting dev server. One easy approach:

 ```powershell
 npm install --save-dev dotenv-cli
 npx dotenv -e .env -- npm run start
 ```

 5. In production builds, provide `SUPABASE_URL` and `SUPABASE_ANON_KEY` via your CI / secret manager. NEVER commit `service_role` keys.

 Notes on RLS and security
 - The migration includes example RLS policies. Test them with different users from the Supabase Auth > Users dashboard and the SQL editor using `auth.uid()` emulation.
 - For server-only operations (e.g., accepting members automatically, bulk deletes), use the `service_role` key from a trusted server environment and never include it in the client.
